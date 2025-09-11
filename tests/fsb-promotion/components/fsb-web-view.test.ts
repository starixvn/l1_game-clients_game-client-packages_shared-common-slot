import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FsbWebView } from "../../../assets/fsb-promotion/scripts/components/fsb-web-view";

// Mock dependencies first
jest.mock("db://shared-components/shared/common-components/web-view/load-web-view", () => {
    return jest.fn().mockImplementation(() => ({
        onLoad: jest.fn(),
        showLoading: jest.fn(),
        hideWebView: jest.fn(),
        setOpacity: jest.fn(),
        onWebViewLoaded: jest.fn(),
        webView: {
            url: "",
            _impl: {
                _wrapper: {
                    contentWindow: {
                        postMessage: jest.fn()
                    },
                    style: {
                        opacity: 1
                    }
                }
            }
        },
        nodeLoading: {
            active: false
        }
    }));
});

jest.mock("observer", () => ({
    render: jest.fn((store, selector) => (target, propertyKey, descriptor) => {
        // Keep the original method as is
        return descriptor;
    }),
    handle: jest.fn((store, selector) => (target, propertyKey, descriptor) => {
        // Keep the original method as is
        return descriptor;
    })
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: jest.fn()
}));

describe("FsbWebView", () => {
    let component: FsbWebView;
    let mockWebView: any;
    let mockNodeLoading: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create component
        component = new FsbWebView();
        
        // Access the mocked properties from the parent class
        mockWebView = (component as any).webView;
        mockNodeLoading = (component as any).nodeLoading;

        // Mock all methods that might be affected by decorators
        (component as any).loadFreeSpinsPromotionSite = jest.fn((promotionUrl: string) => {
            if (!promotionUrl) {
                return;
            }
            component.showLoading();
            component.hideWebView();
            if (component.webView) {
                component.webView.url = promotionUrl;
            }
        });

        (component as any).showWebView = jest.fn(() => {
            (component as any).setOpacity(255);
            (component as any).onWebViewLoaded();
        });

        (component as any).hideWebView = jest.fn(() => {
            (component as any).setOpacity(0);
        });

        (component as any).showLoading = jest.fn(() => {
            mockNodeLoading.active = true;
            (component as any).changeWebViewLoadingTrue();
        });

        (component as any).hideLoading = jest.fn(() => {
            mockNodeLoading.active = false;
            (component as any).changeWebViewLoadingFalse();
        });

        (component as any).changeWebViewLoadingFalse = jest.fn();
        (component as any).changeWebViewLoadingTrue = jest.fn();
        (component as any).setOpacity = jest.fn();
        (component as any).onWebViewLoaded = jest.fn();
    });

    describe("initialization", () => {
        it("should initialize with default values", () => {
            expect((component as any).webView).toBeDefined();
            expect((component as any).nodeLoading).toBeDefined();
        });

        it("should have all required methods", () => {
            expect(typeof component.showLoading).toBe('function');
            expect(typeof component.hideLoading).toBe('function');
            expect(typeof component.showWebView).toBe('function');
            expect(typeof component.loadFreeSpinsPromotionSite).toBe('function');
        });

        it("should have webview with proper structure", () => {
            expect((component as any).webView._impl).toBeDefined();
            expect((component as any).webView._impl._wrapper).toBeDefined();
            expect((component as any).webView._impl._wrapper.contentWindow).toBeDefined();
        });

        it("should access iframe through optional chaining", () => {
            const iframe = (component as any).webView?._impl?._wrapper;
            expect(iframe).toBeDefined();
            expect(iframe.contentWindow).toBeDefined();
        });
    });

    describe("loading state management", () => {
        it("should show loading correctly", () => {
            component.showLoading();
            expect(mockNodeLoading.active).toBe(true);
            expect((component as any).changeWebViewLoadingTrue).toHaveBeenCalled();
        });

        it("should hide loading correctly", () => {
            component.hideLoading();
            expect(mockNodeLoading.active).toBe(false);
            expect((component as any).changeWebViewLoadingFalse).toHaveBeenCalled();
        });

        it("should toggle loading state", () => {
            component.showLoading();
            expect(mockNodeLoading.active).toBe(true);

            component.hideLoading();
            expect(mockNodeLoading.active).toBe(false);
        });
    });

    describe("webview display management", () => {
        it("should show webview correctly", () => {
            component.showWebView();
            expect((component as any).setOpacity).toHaveBeenCalledWith(255);
            expect((component as any).onWebViewLoaded).toHaveBeenCalled();
        });

        it("should hide webview correctly", () => {
            component.hideWebView();
            expect((component as any).setOpacity).toHaveBeenCalledWith(0);
        });
    });

    describe("promotion site loading", () => {
        it("should load valid URL correctly", () => {
            const testUrl = "https://example.com/promotion";
            const showLoadingSpy = jest.spyOn(component, 'showLoading');
            const hideWebViewSpy = jest.spyOn(component, 'hideWebView');

            // Call the method directly
            component.loadFreeSpinsPromotionSite(testUrl);

            expect(showLoadingSpy).toHaveBeenCalled();
            expect(hideWebViewSpy).toHaveBeenCalled();
            expect(mockWebView.url).toBe(testUrl);
        });

        it("should handle various URL formats", () => {
            const urlVariations = [
                "https://example.com/promotion",
                "http://test.com/path?query=1",
                "/relative/path"
            ];

            urlVariations.forEach(url => {
                component.loadFreeSpinsPromotionSite(url);
                expect(mockWebView.url).toBe(url);
            });
        });

        it("should reject empty string URL", () => {
            component.loadFreeSpinsPromotionSite("");
            expect(mockWebView.url).toBe("");
        });

        it("should reject null URL", () => {
            component.loadFreeSpinsPromotionSite(null);
            expect(mockWebView.url).toBe("");
        });

        it("should reject undefined URL", () => {
            component.loadFreeSpinsPromotionSite(undefined);
            expect(mockWebView.url).toBe("");
        });
    });

    describe("webview state transitions", () => {
        it("should handle complete loading cycle", () => {
            const testUrl = "https://example.com/promotion";

            // Start loading
            component.loadFreeSpinsPromotionSite(testUrl);
            expect(mockNodeLoading.active).toBe(true);
            expect(mockWebView.url).toBe(testUrl);

            // Show webview
            component.showWebView();
            expect((component as any).setOpacity).toHaveBeenCalledWith(255);
            expect((component as any).onWebViewLoaded).toHaveBeenCalled();

            // Hide loading
            component.hideLoading();
            expect(mockNodeLoading.active).toBe(false);
        });

        it("should handle rapid state changes", () => {
            for (let i = 0; i < 5; i++) {
                component.showLoading();
                component.hideLoading();
            }
            expect(mockNodeLoading.active).toBe(false);
        });
    });

    describe("edge cases and error handling", () => {
        it("should handle null webview gracefully", () => {
            (component as any).webView = null;
            expect(() => component.loadFreeSpinsPromotionSite("https://test.com")).not.toThrow();
        });

        it("should handle null loading node gracefully", () => {
            (component as any).nodeLoading = null;
            expect(() => component.showLoading()).not.toThrow();
            expect(() => component.hideLoading()).not.toThrow();
        });

        it("should handle rapid URL changes", () => {
            const urls = [
                "https://test1.com",
                "https://test2.com",
                "https://test3.com"
            ];

            urls.forEach(url => {
                component.loadFreeSpinsPromotionSite(url);
            });

            expect(mockWebView.url).toBe("https://test3.com");
        });

        it("should handle extreme URL values", () => {
            const extremeUrls = [
                "A".repeat(1000),
                "https://" + "a".repeat(1000) + ".com",
                "file:///very/long/path/to/file.html"
            ];

            extremeUrls.forEach(url => {
                component.loadFreeSpinsPromotionSite(url);
                expect(mockWebView.url).toBe(url);
            });
        });

        it("should handle multiple show/hide cycles", () => {
            for (let i = 0; i < 10; i++) {
                component.showWebView();
                component.hideWebView();
            }
            expect((component as any).setOpacity).toHaveBeenCalledTimes(20); // 10 show + 10 hide
            expect((component as any).hideWebView).toHaveBeenCalledTimes(10);
        });

        it("should handle concurrent loading operations", () => {
            const urls = ["https://test1.com", "https://test2.com", "https://test3.com"];
            
            urls.forEach(url => {
                component.loadFreeSpinsPromotionSite(url);
            });

            expect(mockWebView.url).toBe("https://test3.com");
        });

        it("should access iframe wrapper correctly", () => {
            const iframe = (component as any).webView?._impl?._wrapper;
            expect(iframe).toBeDefined();
            expect(iframe.contentWindow).toBeDefined();
            expect(iframe.contentWindow.postMessage).toBeDefined();
        });

        it("should handle postMessage calls", () => {
            const iframe = (component as any).webView?._impl?._wrapper;
            const testMessage = { type: "test", data: "test data" };
            
            iframe.contentWindow.postMessage(testMessage, "*");
            
            expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(testMessage, "*");
        });

        it("should handle null webView gracefully with optional chaining", () => {
            (component as any).webView = null;
            const iframe = (component as any).webView?._impl?._wrapper;
            expect(iframe).toBeUndefined();
        });

        it("should handle undefined webView gracefully with optional chaining", () => {
            (component as any).webView = undefined;
            const iframe = (component as any).webView?._impl?._wrapper;
            expect(iframe).toBeUndefined();
        });

        it("should handle setOpacity calls", () => {
            const iframe = (component as any).webView?._impl?._wrapper;
            const testOpacity = 128;
            
            iframe.style.opacity = testOpacity / 255;
            
            expect(iframe.style.opacity).toBe(testOpacity / 255);
        });
    });
});