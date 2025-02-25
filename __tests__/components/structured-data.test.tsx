/**
 * @jest-environment jsdom
 */
import StructuredData from "@/components/structured-data";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";

describe("StructuredData component", () => {
  // Setup DOM mock for document.head methods
  beforeEach(() => {
    // Clear all document.head modifications
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((el) => el.remove());
  });

  it("should not render any visible elements", () => {
    const { container } = render(<StructuredData word="test" />);
    expect(container.firstChild).toBeNull();
  });

  it("should add a script tag to document head with the correct word", () => {
    // Mock document methods
    const appendChildSpy = jest.spyOn(document.head, "appendChild");

    render(<StructuredData word="etymology" />);

    // No need to run timers - useEffect runs synchronously in tests

    // Verify appendChild was called with a script element
    expect(appendChildSpy).toHaveBeenCalled();

    // Get all JSON-LD scripts in the document
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    expect(scripts.length).toBe(1);

    // Parse the content and check the word
    const scriptContent = JSON.parse(scripts[0].textContent || "{}");
    expect(scriptContent.name).toBe("etymology");

    // Cleanup
    appendChildSpy.mockRestore();
  });

  it("should update script when word prop changes", () => {
    const { rerender } = render(<StructuredData word="first" />);

    // Get the first script content
    let scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    let scriptContent = JSON.parse(scripts[0].textContent || "{}");
    expect(scriptContent.name).toBe("first");

    // Rerender with a new word
    rerender(<StructuredData word="second" />);

    // Get updated script content
    scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scriptContent = JSON.parse(scripts[0].textContent || "{}");
    expect(scriptContent.name).toBe("second");
  });

  it("should include definition when provided", () => {
    render(
      <StructuredData
        word="dictionary"
        definition="A reference book containing words with their definitions"
      />
    );

    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    const scriptContent = JSON.parse(scripts[0].textContent || "{}");

    expect(scriptContent.description).toBe(
      "A reference book containing words with their definitions"
    );
  });

  it("should use default description when no definition is provided", () => {
    render(<StructuredData word="thesaurus" />);

    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    const scriptContent = JSON.parse(scripts[0].textContent || "{}");

    expect(scriptContent.description).toBe(
      'Etymology and origin of the word "thesaurus"'
    );
  });

  it("should remove script when component unmounts", () => {
    const { unmount } = render(<StructuredData word="unmount" />);

    // Script should exist before unmounting
    expect(
      document.querySelectorAll('script[type="application/ld+json"]').length
    ).toBe(1);

    // Unmount component
    unmount();

    // Script should be removed
    expect(
      document.querySelectorAll('script[type="application/ld+json"]').length
    ).toBe(0);
  });
});
