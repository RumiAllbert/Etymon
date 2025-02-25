/**
 * @jest-environment jsdom
 */
import { getCanvasFont, getTextWidth } from '@/utils/text-width';

describe('text-width utility', () => {
  beforeEach(() => {
    // Mock clientWidth property
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 100, // Default mock width
    });

    // Mock getComputedStyle
    window.getComputedStyle = jest.fn().mockImplementation(() => {
      return {
        getPropertyValue: (prop: string) => {
          switch (prop) {
            case 'font-weight':
              return '400';
            case 'font-size':
              return '16px';
            case 'font-family':
              return 'Arial, sans-serif';
            default:
              return '';
          }
        },
      };
    });

    // Mock appendChild
    document.body.appendChild = jest.fn().mockImplementation(() => {});
    document.querySelector = jest.fn().mockImplementation(() => null);

    // Mock console.log to prevent noise in tests
    console.log = jest.fn();
  });

  describe('getTextWidth', () => {
    it('should return the clientWidth of the element', () => {
      const width = getTextWidth('test', '16px Arial');
      expect(width).toBe(100);
    });

    it('should reuse the span element if it exists', () => {
      // First call creates the element
      getTextWidth('first call', '16px Arial');
      
      // Mock a different width for the second call
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        value: 200,
      });
      
      const width = getTextWidth('second call', '16px Arial');
      expect(width).toBe(200);
    });

    it('should set the correct text content and styles on the element', () => {
      // Reset the element property to ensure we create a new one
      if (getTextWidth.element) {
        delete getTextWidth.element;
      }
      
      // Call the function
      getTextWidth('test text', '16px Arial');
      
      // Now get the element that was created
      const element = getTextWidth.element;
      
      // Verify the element exists and has correct properties
      expect(element).toBeDefined();
      expect(element.textContent).toBe('test text');
      
      // Since we can't spy on style property assignment directly in this environment,
      // we'll just verify the element has the expected styles after the function call
      // Note: We don't check exact string equality for font because browsers may format it differently
      expect(element.style.font).toContain('Arial');
      expect(element.style.font).toContain('16px');
      expect(element.style.position).toBe('absolute');
      expect(element.style.whiteSpace).toBe('nowrap');
    });
  });

  describe('getCanvasFont', () => {
    it('should return a font string based on computed styles', () => {
      const font = getCanvasFont();
      expect(font).toBe('400 16px Arial, sans-serif');
    });

    it('should use the provided element to get styles', () => {
      const mockElement = document.createElement('div');
      
      // Mock different computed styles for this element
      window.getComputedStyle = jest.fn().mockImplementation(() => {
        return {
          getPropertyValue: (prop: string) => {
            switch (prop) {
              case 'font-weight':
                return 'bold';
              case 'font-size':
                return '20px';
              case 'font-family':
                return 'Times New Roman';
              default:
                return '';
            }
          },
        };
      });
      
      const font = getCanvasFont(mockElement);
      expect(font).toBe('bold 20px Times New Roman');
    });
  });
}); 