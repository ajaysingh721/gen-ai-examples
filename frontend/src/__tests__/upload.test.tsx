/// <reference types="jest" />

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import UploadSummarizePage from "@/app/(protected)/upload/page"

describe("UploadSummarizePage", () => {
  it("shows validation error when no file is selected", async () => {
    const user = userEvent.setup()
    render(<UploadSummarizePage />)

    await user.click(
      screen.getByRole("button", { name: /analyze document/i })
    )

    expect(
      await screen.findByText(/please select a pdf or tiff file/i)
    ).toBeInTheDocument()
  })

  it("shows validation error for unsupported file type", async () => {
    const user = userEvent.setup()
    render(<UploadSummarizePage />)

    const input = screen.getByLabelText(/document file/i) as HTMLInputElement
    const badFile = new File(["hello"], "notes.txt", { type: "text/plain" })

    await user.upload(input, badFile)

    await user.click(
      screen.getByRole("button", { name: /analyze document/i })
    )

    expect(await screen.findByText(/supported types: pdf, tiff/i)).toBeInTheDocument()
  })
})
