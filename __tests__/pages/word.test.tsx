import Page, { generateMetadata } from "@/app/word/[word]/page";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// Mock the components used in the Page
jest.mock("@/components/deconstructor", () => {
  return function MockDeconstructor({ word }: { word: string }) {
    return <div data-testid="deconstructor-mock">{word}</div>;
  };
});

jest.mock("@/components/structured-data", () => {
  return function MockStructuredData({ word }: { word: string }) {
    return <div data-testid="structured-data-mock">{word}</div>;
  };
});

describe("Word Page", () => {
  it("should render WordDeconstructor with the decoded word", async () => {
    // Create a mock promise for params
    const params = Promise.resolve({ word: "hello" });

    // Render the component
    const component = await Page({ params });
    render(component);

    // Check that the deconstructor component receives the correct word
    expect(screen.getByTestId("deconstructor-mock")).toHaveTextContent("hello");
  });

  it("should render StructuredData with the decoded word", async () => {
    const params = Promise.resolve({ word: "hello" });
    const component = await Page({ params });
    render(component);

    expect(screen.getByTestId("structured-data-mock")).toHaveTextContent(
      "hello"
    );
  });

  it("should handle URL encoded words correctly", async () => {
    // Test with an encoded word
    const params = Promise.resolve({ word: "hello%20world" });
    const component = await Page({ params });
    render(component);

    expect(screen.getByTestId("deconstructor-mock")).toHaveTextContent(
      "hello world"
    );
    expect(screen.getByTestId("structured-data-mock")).toHaveTextContent(
      "hello world"
    );
  });

  it("should handle special characters in words", async () => {
    const params = Promise.resolve({ word: "caf%C3%A9" }); // café encoded
    const component = await Page({ params });
    render(component);

    expect(screen.getByTestId("deconstructor-mock")).toHaveTextContent("café");
    expect(screen.getByTestId("structured-data-mock")).toHaveTextContent(
      "café"
    );
  });
});

describe("generateMetadata function", () => {
  it("should generate correct metadata for a simple word", async () => {
    const params = Promise.resolve({ word: "test" });
    const searchParams = Promise.resolve({});
    const parent = {} as any;

    const metadata = await generateMetadata({ params, searchParams }, parent);

    expect(metadata.title).toBe(
      "Test Etymology - Word Origin and History | Etymon.ai"
    );
    expect(metadata.description).toContain("test");
    expect(metadata.keywords).toContain("test etymology");
  });

  it("should capitalize the first letter of the word in the title", async () => {
    const params = Promise.resolve({ word: "programming" });
    const searchParams = Promise.resolve({});
    const parent = {} as any;

    const metadata = await generateMetadata({ params, searchParams }, parent);

    expect(metadata.title).toContain("Programming Etymology");
  });

  it("should handle URL encoded words", async () => {
    const params = Promise.resolve({ word: "artificial%20intelligence" });
    const searchParams = Promise.resolve({});
    const parent = {} as any;

    const metadata = await generateMetadata({ params, searchParams }, parent);

    expect(metadata.title).toContain("Artificial intelligence");
    expect(metadata.description).toContain("artificial intelligence");
  });

  it("should set correct OpenGraph and Twitter metadata", async () => {
    const params = Promise.resolve({ word: "computer" });
    const searchParams = Promise.resolve({});
    const parent = {} as any;

    const metadata = await generateMetadata({ params, searchParams }, parent);

    expect(metadata.openGraph?.title).toContain("Computer Etymology");
    expect(metadata.twitter?.title).toContain("Computer Etymology");
    expect(metadata.openGraph?.description).toContain("computer");
    expect(metadata.twitter?.description).toContain("computer");
  });
});
