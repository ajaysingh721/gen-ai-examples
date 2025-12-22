"""
Folder watcher service - monitors shared folder for new fax files.
"""

import os
import time
import threading
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Callable
from dataclasses import dataclass, field

from app.services.fax_service import process_new_fax, get_settings

logger = logging.getLogger(__name__)


@dataclass
class WatcherState:
    """State of the folder watcher."""
    is_running: bool = False
    watch_folder: str = ""
    last_scan_at: Optional[datetime] = None
    files_in_queue: int = 0
    processed_files: set = field(default_factory=set)
    errors: List[str] = field(default_factory=list)
    currently_processing_file: Optional[str] = None


class FaxFolderWatcher:
    """
    Watches a shared folder for new fax files and processes them automatically.
    """
    
    SUPPORTED_EXTENSIONS = {'.pdf', '.tif', '.tiff'}
    
    def __init__(self, watch_folder: Optional[str] = None, scan_interval: int = 10):
        """
        Initialize the folder watcher.
        
        Args:
            watch_folder: Path to the folder to watch. If None, uses settings.
            scan_interval: How often to scan the folder (in seconds).
        """
        self.scan_interval = scan_interval
        self._state = WatcherState()
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._callbacks: List[Callable] = []
        
        # Set watch folder from parameter or settings
        if watch_folder:
            self._state.watch_folder = watch_folder
        else:
            try:
                settings = get_settings()
                self._state.watch_folder = settings.watch_folder
            except:
                self._state.watch_folder = os.environ.get("FAX_WATCH_FOLDER", "./fax_inbox")
    
    @property
    def state(self) -> WatcherState:
        """Get current watcher state."""
        return self._state
    
    @property
    def is_running(self) -> bool:
        """Check if watcher is running."""
        return self._state.is_running
    
    def add_callback(self, callback: Callable):
        """Add a callback to be called when a new fax is processed."""
        self._callbacks.append(callback)
    
    def start(self):
        """Start the folder watcher in a background thread."""
        if self._state.is_running:
            logger.warning("Watcher is already running")
            return
        
        # Ensure watch folder exists
        watch_path = Path(self._state.watch_folder)
        if not watch_path.exists():
            try:
                watch_path.mkdir(parents=True, exist_ok=True)
                logger.info(f"Created watch folder: {watch_path}")
            except Exception as e:
                error_msg = f"Failed to create watch folder: {e}"
                logger.error(error_msg)
                self._state.errors.append(error_msg)
                return
        
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._watch_loop, daemon=True)
        self._thread.start()
        self._state.is_running = True
        logger.info(f"Started watching folder: {self._state.watch_folder}")
    
    def stop(self):
        """Stop the folder watcher."""
        if not self._state.is_running:
            return
        
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)
        self._state.is_running = False
        logger.info("Stopped folder watcher")
    
    def _watch_loop(self):
        """Main watch loop that runs in background thread."""
        while not self._stop_event.is_set():
            try:
                self._scan_folder()
            except Exception as e:
                error_msg = f"Error during folder scan: {e}"
                logger.error(error_msg)
                self._state.errors.append(error_msg)
                # Keep only last 10 errors
                self._state.errors = self._state.errors[-10:]
            
            # Wait for next scan interval
            self._stop_event.wait(self.scan_interval)
    
    def _scan_folder(self):
        """Scan the watch folder for new files."""
        watch_path = Path(self._state.watch_folder)
        
        if not watch_path.exists():
            return
        
        self._state.last_scan_at = datetime.utcnow()
        
        # Find all supported files
        new_files = []
        for file_path in watch_path.iterdir():
            if not file_path.is_file():
                continue
            
            if file_path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:
                continue
            
            # Skip already processed files
            file_key = str(file_path.absolute())
            if file_key in self._state.processed_files:
                continue
            
            # Skip files that are still being written (check if file is stable)
            if not self._is_file_ready(file_path):
                continue
            
            new_files.append(file_path)
        
        self._state.files_in_queue = len(new_files)
        
        # Process new files
        for file_path in new_files:
            try:
                self._process_file(file_path)
            except Exception as e:
                error_msg = f"Error processing {file_path.name}: {e}"
                logger.error(error_msg)
                self._state.errors.append(error_msg)
                self._state.errors = self._state.errors[-10:]
    
    def _is_file_ready(self, file_path: Path) -> bool:
        """
        Check if a file is ready to be processed (not still being written).
        """
        try:
            # Check if file size is stable
            size1 = file_path.stat().st_size
            time.sleep(0.5)  # Short wait
            size2 = file_path.stat().st_size
            
            if size1 != size2:
                return False  # File is still being written
            
            # Try to open the file exclusively
            try:
                with open(file_path, 'rb') as f:
                    f.read(1)
                return True
            except (IOError, PermissionError):
                return False
                
        except Exception:
            return False
    
    def _process_file(self, file_path: Path):
        """Process a single fax file."""
        logger.info(f"Processing new fax: {file_path.name}")
        
        try:
            # Set currently processing file
            self._state.currently_processing_file = file_path.name
            
            result = process_new_fax(
                file_path=str(file_path.absolute()),
                filename=file_path.name
            )
            
            if result:
                logger.info(f"Processed fax {file_path.name}: category={result.ai_category}")
                
                # Mark as processed
                self._state.processed_files.add(str(file_path.absolute()))
                
                # Optionally move file to processed folder
                self._move_to_processed(file_path)
                
                # Call callbacks
                for callback in self._callbacks:
                    try:
                        callback(result)
                    except Exception as e:
                        logger.error(f"Callback error: {e}")
            else:
                # Duplicate file
                logger.info(f"Skipped duplicate fax: {file_path.name}")
                self._state.processed_files.add(str(file_path.absolute()))
                
        except Exception as e:
            logger.error(f"Failed to process {file_path.name}: {e}")
            raise
        finally:
            # Clear currently processing file
            self._state.currently_processing_file = None
    
    def _move_to_processed(self, file_path: Path):
        """Move processed file to a 'processed' subfolder."""
        try:
            processed_folder = file_path.parent / "processed"
            processed_folder.mkdir(exist_ok=True)
            
            dest_path = processed_folder / file_path.name
            
            # Handle duplicate names
            counter = 1
            while dest_path.exists():
                stem = file_path.stem
                suffix = file_path.suffix
                dest_path = processed_folder / f"{stem}_{counter}{suffix}"
                counter += 1
            
            file_path.rename(dest_path)
            logger.info(f"Moved {file_path.name} to processed folder")
            
        except Exception as e:
            logger.warning(f"Could not move file to processed folder: {e}")
    
    def manual_scan(self):
        """Trigger an immediate scan of the folder."""
        if not self._state.is_running:
            # Do a one-time scan
            try:
                self._scan_folder()
            except Exception as e:
                logger.error(f"Manual scan error: {e}")
                self._state.errors.append(str(e))
        # If running, the next scan will happen automatically


# Global watcher instance
_watcher: Optional[FaxFolderWatcher] = None


def get_watcher() -> FaxFolderWatcher:
    """Get or create the global watcher instance."""
    global _watcher
    if _watcher is None:
        _watcher = FaxFolderWatcher()
    return _watcher


def start_watcher(watch_folder: Optional[str] = None) -> FaxFolderWatcher:
    """Start the global folder watcher."""
    global _watcher
    if _watcher is None:
        _watcher = FaxFolderWatcher(watch_folder=watch_folder)
    _watcher.start()
    return _watcher


def stop_watcher():
    """Stop the global folder watcher."""
    global _watcher
    if _watcher:
        _watcher.stop()
