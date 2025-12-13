/// <reference types="jest" />

import { render, screen } from "@testing-library/react"

import HomePage from "@/app/(protected)/page"

describe("HomePage", () => {
  it("renders quick action cards", () => {
    render(<HomePage />)

    expect(
      screen.getByRole("heading", { name: /home/i })
    ).toBeInTheDocument()

    expect(
      screen.getByRole("link", { name: /go to upload/i })
    ).toHaveAttribute("href", "/upload")

    expect(screen.getByText(/recent documents/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /view recent/i })).toBeInTheDocument()
  })
})
