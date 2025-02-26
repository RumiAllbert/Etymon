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

describe("WordDeconstructor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
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
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            thought: "Test response",
            parts: [],
            combinations: [],
            similarWords: [],
          }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

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
  });

  describe("Caching", () => {
    const mockCachedData = {
      data: {
        thought: "Test thought",
        parts: [],
        combinations: [],
        similarWords: [],
      },
      timestamp: Date.now(),
      originalWord: "test",
    };

    it("uses cached data when available", async () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
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
  });

  describe("Error Handling", () => {
    it("handles API errors gracefully", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("API Error"));

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
});
