import * as React from "react";

// Standard responsive breakpoints (following Tailwind CSS conventions)
export const BREAKPOINTS = {
  xs: 0, // Extra small devices (phones in portrait)
  sm: 640, // Small devices (phones in landscape)
  md: 768, // Medium devices (tablets)
  lg: 1024, // Large devices (desktops)
  xl: 1280, // Extra large devices (large desktops)
  "2xl": 1536, // 2X large devices (wide screens)
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
export type DeviceType = "mobile" | "tablet" | "desktop";
export type Orientation = "portrait" | "landscape";

interface ScreenInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  orientation: Orientation;
  isTouchDevice: boolean;
  breakpoint: BreakpointKey;
  isRetina: boolean;
}

const MOBILE_BREAKPOINT = BREAKPOINTS.md;
const TABLET_BREAKPOINT = BREAKPOINTS.lg;

/**
 * Basic mobile detection hook (original functionality)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

/**
 * Comprehensive screen information hook with device detection,
 * orientation, touch support, and responsive breakpoints
 */
export function useScreenInfo(): ScreenInfo {
  const [screenInfo, setScreenInfo] = React.useState<ScreenInfo>(() =>
    getScreenInfo()
  );

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events for better performance
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScreenInfo(getScreenInfo());
      }, 100);
    };

    const handleOrientationChange = () => {
      setScreenInfo(getScreenInfo());
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);

    // Initial set
    setScreenInfo(getScreenInfo());

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  return screenInfo;
}

/**
 * Hook to check if current viewport matches a specific breakpoint or range
 */
export function useBreakpoint(breakpoint: BreakpointKey): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const minWidth = BREAKPOINTS[breakpoint];
    const breakpointKeys = Object.keys(BREAKPOINTS) as BreakpointKey[];
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    const nextBreakpoint = breakpointKeys[currentIndex + 1];
    const maxWidth = nextBreakpoint
      ? BREAKPOINTS[nextBreakpoint] - 1
      : undefined;

    const query = maxWidth
      ? `(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`
      : `(min-width: ${minWidth}px)`;

    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    mql.addEventListener("change", onChange);
    setMatches(mql.matches);

    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return matches;
}

/**
 * Hook to check if viewport is at least a certain breakpoint (min-width)
 */
export function useMinBreakpoint(breakpoint: BreakpointKey): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const minWidth = BREAKPOINTS[breakpoint];
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const onChange = () => setMatches(mql.matches);

    mql.addEventListener("change", onChange);
    setMatches(mql.matches);

    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return matches;
}

/**
 * Hook to detect device orientation
 */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = React.useState<Orientation>("portrait");

  React.useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? "landscape" : "portrait"
      );
    };

    const mql = window.matchMedia("(orientation: portrait)");
    const onChange = () => updateOrientation();

    mql.addEventListener("change", onChange);
    updateOrientation();

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return orientation;
}

/**
 * Hook to detect if device supports touch
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    setIsTouch(
      "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is IE-specific
        navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * Hook to detect if device has a high-DPI (Retina) display
 */
export function useIsRetina(): boolean {
  const [isRetina, setIsRetina] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(min-resolution: 2dppx)");
    const onChange = () => setIsRetina(mql.matches);

    mql.addEventListener("change", onChange);
    setIsRetina(mql.matches);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isRetina;
}

/**
 * Hook to detect user's preferred color scheme
 */
export function usePreferredColorScheme(): "light" | "dark" {
  const [scheme, setScheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setScheme(mql.matches ? "dark" : "light");

    mql.addEventListener("change", onChange);
    setScheme(mql.matches ? "dark" : "light");

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return scheme;
}

/**
 * Hook to detect if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefersReducedMotion(mql.matches);

    mql.addEventListener("change", onChange);
    setPrefersReducedMotion(mql.matches);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Custom media query hook for any arbitrary query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    mql.addEventListener("change", onChange);
    setMatches(mql.matches);

    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

// Helper function to get current screen info
function getScreenInfo(): ScreenInfo {
  if (typeof window === "undefined") {
    // SSR fallback
    return {
      width: 0,
      height: 0,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      deviceType: "desktop",
      orientation: "landscape",
      isTouchDevice: false,
      breakpoint: "lg",
      isRetina: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < MOBILE_BREAKPOINT;
  const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
  const isDesktop = width >= TABLET_BREAKPOINT;

  const deviceType: DeviceType = isMobile
    ? "mobile"
    : isTablet
    ? "tablet"
    : "desktop";
  const orientation: Orientation = width > height ? "landscape" : "portrait";

  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const breakpoint = getCurrentBreakpoint(width);
  const isRetina = window.devicePixelRatio >= 2;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    orientation,
    isTouchDevice,
    breakpoint,
    isRetina,
  };
}

// Helper to determine current breakpoint
function getCurrentBreakpoint(width: number): BreakpointKey {
  const breakpointKeys = Object.keys(BREAKPOINTS) as BreakpointKey[];

  for (let i = breakpointKeys.length - 1; i >= 0; i--) {
    if (width >= BREAKPOINTS[breakpointKeys[i]]) {
      return breakpointKeys[i];
    }
  }

  return "xs";
}
