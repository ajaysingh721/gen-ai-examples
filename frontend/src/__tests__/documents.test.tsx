/// <reference types="jest" />

import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import DocumentsPage from "@/app/(protected)/documents/page"

function mockFetchOnce(data: any, ok = true, status = 200) {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  })
}

describe("DocumentsPage", () => {
  it("loads documents and opens summary dialog", async () => {
    const docs = [
      {
        id: 1,
        filename: "test.pdf",
        doc_type: "discharge_summary",
        summary: "- Summary line 1\n- Summary line 2",
        text_length: 123,
        created_at: new Date("2025-01-01T00:00:00Z").toISOString(),
      },
    ]

    // First fetch: list documents
    global.fetch = mockFetchOnce(docs) as any

    render(<DocumentsPage />)

    // Wait for row to render
    await screen.findByText("test.pdf")

    // Open summary dialog
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /view summary/i }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/^summary$/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/test\.pdf/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/summary line 1/i)).toBeInTheDocument()
  })

  it("deletes a document after confirmation", async () => {
    const docs = [
      {
        id: 2,
        filename: "delete-me.pdf",
        doc_type: "junk",
        summary: "junk",
        text_length: 10,
        created_at: new Date("2025-01-02T00:00:00Z").toISOString(),
      },
    ]

    const fetchMock = jest
      .fn()
      // list
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => docs,
      })
      // delete
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      })

    global.fetch = fetchMock as any

    const user = userEvent.setup()
    render(<DocumentsPage />)

    await screen.findByText("delete-me.pdf")

    await user.click(screen.getByRole("button", { name: /delete document/i }))
    expect(await screen.findByText(/delete document\?/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^delete$/i }))

    await waitFor(() => {
      expect(screen.queryByText("delete-me.pdf")).not.toBeInTheDocument()
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/v1/documents/2",
      { method: "DELETE" }
    )
  })
})
