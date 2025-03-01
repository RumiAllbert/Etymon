/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import { toast } from "sonner";

// Mock the external dependencies
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock lucide-react
jest.mock("lucide-react", () => ({
  BookOpen: () => <div data-testid="book-open-icon" />,
}));

// Mock next-plausible
jest.mock("next-plausible", () => ({
  usePlausible: () => jest.fn(),
}));

// Mock ReactFlow
jest.mock("@xyflow/react", () => {
  const InputNode = ({ data }) => (
    <div data-testid="input-node">
      <form onSubmit={data.onSubmit} className="px-6 py-4">
        <input
          type="text"
          placeholder="Enter a word"
          className="flex-1 px-3 py-2"
          data-testid="word-input"
          name="word"
        />
        <button type="submit" data-testid="submit-button">
          Etymologize
        </button>
        <button
          type="button"
          data-testid="history-button"
          onClick={data.onHistoryClick}
        >
          History
        </button>
      </form>
    </div>
  );

  return {
    ReactFlow: ({ nodes, children }) => (
      <div data-testid="react-flow">
        {nodes?.map((node) => {
          if (node.type === "inputNode") {
            return <InputNode key={node.id} data={node.data} />;
          }
          return null;
        })}
        {children}
      </div>
    ),
    Background: () => <div data-testid="react-flow-background" />,
    Handle: () => <div data-testid="react-flow-handle" />,
    Position: { Bottom: "bottom", Top: "top" },
    ReactFlowProvider: ({ children }) => (
      <div data-testid="react-flow-provider">{children}</div>
    ),
    useNodesState: () => {
      const initialNodes = [
        {
          id: "input1",
          type: "inputNode",
          position: { x: 0, y: 0 },
          data: {
            onSubmit: jest.fn((e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const word = formData.get("word");
              if (word) {
                e.target.dispatchEvent(
                  new CustomEvent("etymologize", {
                    bubbles: true,
                    detail: { word },
                  })
                );
              }
            }),
            onHistoryClick: jest.fn(),
          },
        },
      ];
      return [initialNodes, jest.fn(), jest.fn()];
    },
    useEdgesState: () => [[], jest.fn(), jest.fn()],
    useNodesInitialized: () => true,
    useReactFlow: () => ({
      fitView: jest.fn(),
    }),
  };
});

// Mock localStorage with in-memory store
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    _getStore: () => store, // Helper for tests
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Import the component
import WordDeconstructor, {
  CACHE_PREFIX,
  HISTORY_KEY,
} from "@/components/deconstructor";

// Valid mock data for tests
const validEnglishWordData = {
  thought: "Test etymology for English word",
  parts: [
    {
      id: "part1",
      text: "te",
      originalWord: "te",
      origin: "Latin",
      meaning: "test meaning 1",
    },
    {
      id: "part2",
      text: "st",
      originalWord: "st",
      origin: "Germanic",
      meaning: "test meaning 2",
    },
  ],
  combinations: [
    [
      {
        id: "test",
        text: "test",
        definition: "A test word",
        sourceIds: ["part1", "part2"],
      },
    ],
  ],
  similarWords: [
    {
      word: "testing",
      explanation: "Related to test",
      sharedOrigin: "Latin test",
    },
  ],
};

const validGreekWordData = {
  thought:
    "Test etymology for Greek word φιλοσοφία (philosophia) which means philosophy",
  parts: [
    {
      id: "phil",
      text: "φιλο",
      originalWord: "φίλος",
      origin: "Ancient Greek",
      meaning: "loving",
    },
    {
      id: "sophia",
      text: "σοφία",
      originalWord: "σοφία",
      origin: "Ancient Greek",
      meaning: "wisdom",
    },
  ],
  combinations: [
    [
      {
        id: "philosophia",
        text: "Φιλοσοφία",
        definition: "Love of wisdom",
        sourceIds: ["phil", "sophia"],
      },
    ],
  ],
  similarWords: [
    {
      word: "φιλόλογος",
      explanation: "Love of words",
      sharedOrigin: "Greek φίλος (philos)",
    },
  ],
};

describe("WordDeconstructor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    // Properly type the mocked fetch function
    global.fetch = jest.fn() as jest.MockedFunction<typeof global.fetch>;
  });

  describe("Core Functionality", () => {
    it("renders the search input and buttons", () => {
      render(
        <Provider>
          <WordDeconstructor />
        </Provider>
      );

      expect(screen.getByTestId("word-input")).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(screen.getByTestId("history-button")).toBeInTheDocument();
    });

    it("handles word submission", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validEnglishWordData),
      }) as jest.MockedFunction<typeof global.fetch>;

      render(
        <Provider>
          <WordDeconstructor />
        </Provider>
      );

      const input = screen.getByTestId("word-input");
      const form = input.closest("form");

      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          HISTORY_KEY,
          expect.any(String)
        );
      });
    });

    it("handles Greek word submission", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validGreekWordData),
      }) as jest.MockedFunction<typeof global.fetch>;

      render(
        <Provider>
          <WordDeconstructor />
        </Provider>
      );

      const input = screen.getByTestId("word-input");
      const form = input.closest("form");

      fireEvent.change(input, { target: { value: "philosophy" } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const fetchCall = (
          global.fetch as jest.MockedFunction<typeof global.fetch>
        ).mock.calls[0];
        expect(JSON.parse(fetchCall[1].body as string).word).toBe("philosophy");
      });
    });
  });

  describe("Caching", () => {
    it("uses cached data when available for English words", async () => {
      const mockCachedData = {
        data: validEnglishWordData,
        timestamp: Date.now(),
        originalWord: "test",
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === `${CACHE_PREFIX}test`) {
          return JSON.stringify(mockCachedData);
        }
        return null;
      });

      render(
        <Provider>
          <WordDeconstructor word="test" />
        </Provider>
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Retrieved from cache",
          expect.any(Object)
        );
      });
    });

    it("uses cached data when available for Greek words", async () => {
      const mockCachedData = {
        data: validGreekWordData,
        timestamp: Date.now(),
        originalWord: "philosophy",
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === `${CACHE_PREFIX}philosophy`) {
          return JSON.stringify(mockCachedData);
        }
        return null;
      });

      render(
        <Provider>
          <WordDeconstructor word="philosophy" />
        </Provider>
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Retrieved from cache",
          expect.any(Object)
        );
      });
    });

    it("invalidates cache when data is corrupted", async () => {
      const corruptedData = {
        data: {
          thought: "Corrupted data",
          // Missing required fields
        },
        timestamp: Date.now(),
        originalWord: "test",
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === `${CACHE_PREFIX}test`) {
          return JSON.stringify(corruptedData);
        }
        return null;
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validEnglishWordData),
      }) as jest.MockedFunction<typeof global.fetch>;

      render(
        <Provider>
          <WordDeconstructor word="test" />
        </Provider>
      );

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
          `${CACHE_PREFIX}test`
        );
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("handles API errors gracefully", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("API Error")) as jest.MockedFunction<
        typeof global.fetch
      >;

      render(
        <Provider>
          <WordDeconstructor />
        </Provider>
      );

      const input = screen.getByTestId("word-input");
      const form = input.closest("form");

      fireEvent.change(input, { target: { value: "error" } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("handles non-200 API responses", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      }) as jest.MockedFunction<typeof global.fetch>;

      render(
        <Provider>
          <WordDeconstructor />
        </Provider>
      );

      const input = screen.getByTestId("word-input");
      const form = input.closest("form");

      fireEvent.change(input, { target: { value: "error" } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe("Greek Word Handling", () => {
    it("applies flexible validation for Greek words", async () => {
      // Create a Greek word response where the final word doesn't match the search term
      // but the thought field mentions the search term
      const greekResponse = {
        ...validGreekWordData,
        thought: "Test etymology for the word philosophy (φιλοσοφία)",
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(greekResponse),
      }) as jest.MockedFunction<typeof global.fetch>;

      render(
        <Provider>
          <WordDeconstructor />
        </Provider>
      );

      const input = screen.getByTestId("word-input");
      const form = input.closest("form");

      fireEvent.change(input, { target: { value: "philosophy" } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        // The response should be accepted despite the mismatch between "philosophy" and "Φιλοσοφία"
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          expect.stringContaining(CACHE_PREFIX),
          expect.any(String)
        );
      });
    });

    it("rejects Greek words when thought field doesn't mention search term", async () => {
      // Create a Greek word response where the final word doesn't match the search term
      // and the thought field doesn't mention the search term
      const invalidGreekResponse = {
        ...validGreekWordData,
        thought: "Test etymology for an unrelated word", // Doesn't mention "philosophy"
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidGreekResponse),
      }) as jest.MockedFunction<typeof global.fetch>;

      render(
        <Provider>
          <WordDeconstructor />
        </Provider>
      );

      const input = screen.getByTestId("word-input");
      const form = input.closest("form");

      fireEvent.change(input, { target: { value: "philosophy" } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });
});
