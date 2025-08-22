import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { FsbWebView } from "../../../assets/fsb-promotion/scripts/components/fsb-web-view";

// Mock decorators first
jest.mock("reflect-metadata", () => ({
    Reflect: {
        decorate: jest.fn(),
        metadata: jest.fn(() => jest.fn()),
        defineMetadata: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

// Mock _decorator from cc
jest.mock("cc", () => ({
    _decorator: {
        ccclass: jest.fn(() => jest.fn()),
        property: jest.fn(() => jest.fn()),
    },
    Node: jest.fn(),
    EventTarget: jest.fn().mockImplementation(() => ({
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
    Component: jest.fn(),
}));

// Mock dependencies
jest.mock("db://shared-components/shared/common-components/web-view/load-web-view", () => ({
    __esModule: true,
    default: class MockLoadWebView {
        webView = null;
        nodeLoading = { active: false };
        
        onLoad = jest.fn();
        setOpacity = jest.fn();
        onWebViewLoaded = jest.fn();
        hideWebView = jest.fn();
    }
}));

jest.mock("../../../assets/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: jest.fn(),
}));

jest.mock("observer", () => ({
    __esModule: true,
    default: {
        render: jest.fn(() => jest.fn()),
        handle: jest.fn(() => jest.fn()),
    },
}));

// Mock cascading slot dependencies
jest.mock("db://shared-cascading-slot/cascading-slot-utils", () => ({
    globalEmitter: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    },
    SlotClientEvent: {},
    SlotNotification: {},
}));

describe("FsbWebView", () => {
    let component: FsbWebView;
    let mockWebView: any;
    let mockNodeLoading: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock webView object
        mockWebView = {
            url: ""
        };

        // Create mock nodeLoading object
        mockNodeLoading = {
            active: false
        };

        // Create component instance
        component = new FsbWebView();
        component.webView = mockWebView;
        component.nodeLoading = mockNodeLoading;

        // Mock inherited methods
        component.setOpacity = jest.fn();
        component['onWebViewLoaded'] = jest.fn();
        component.hideWebView = jest.fn();
        
        // Mock methods that will be handled by decorators
        component.changeWebViewLoadingFalse = jest.fn();
        component.changeWebViewLoadingTrue = jest.fn();
    });

    describe("loadFreeSpinsPromotionSite", () => {
        it("should return early when promotionUrl is empty string", () => {
            // Act
            component.loadFreeSpinsPromotionSite("");

            // Assert
            expect(component.setOpacity).not.toHaveBeenCalled();
            expect(component.hideWebView).not.toHaveBeenCalled();
            expect(mockWebView.url).toBe("");
        });

        it("should return early when promotionUrl is null", () => {
            // Act
            component.loadFreeSpinsPromotionSite(null);

            // Assert
            expect(component.setOpacity).not.toHaveBeenCalled();
            expect(component.hideWebView).not.toHaveBeenCalled();
            expect(mockWebView.url).toBe("");
        });

        it("should set webView url when promotionUrl is valid", () => {
            // Arrange
            const testUrl = "https://example.com/promotion";
            const showLoadingSpy = jest.spyOn(component, 'showLoading');

            // Act
            component.loadFreeSpinsPromotionSite(testUrl);

            // Assert
            expect(showLoadingSpy).toHaveBeenCalled();
            expect(component.hideWebView).toHaveBeenCalled();
            expect(mockWebView.url).toBe(testUrl);
        });
    });

    describe("showWebView", () => {
        it("should set opacity to 255 and call onWebViewLoaded", () => {
            // Act
            component.showWebView();

            // Assert
            expect(component.setOpacity).toHaveBeenCalledWith(255);
            expect(component['onWebViewLoaded']).toHaveBeenCalled();
        });
    });

    describe("showLoading", () => {
        it("should activate nodeLoading and call changeWebViewLoadingTrue", () => {
            // Arrange
            expect(mockNodeLoading.active).toBe(false);

            // Act
            component.showLoading();

            // Assert
            expect(mockNodeLoading.active).toBe(true);
            expect(component.changeWebViewLoadingTrue).toHaveBeenCalled();
        });
    });

    describe("hideLoading", () => {
        it("should deactivate nodeLoading and call changeWebViewLoadingFalse", () => {
            // Arrange
            mockNodeLoading.active = true;

            // Act
            component.hideLoading();

            // Assert
            expect(mockNodeLoading.active).toBe(false);
            expect(component.changeWebViewLoadingFalse).toHaveBeenCalled();
        });
    });

    describe("changeWebViewLoadingFalse", () => {
        it("should be defined as a method", () => {
            // Assert
            expect(component.changeWebViewLoadingFalse).toBeDefined();
            expect(typeof component.changeWebViewLoadingFalse).toBe('function');
        });
    });

    describe("changeWebViewLoadingTrue", () => {
        it("should be defined as a method", () => {
            // Assert
            expect(component.changeWebViewLoadingTrue).toBeDefined();
            expect(typeof component.changeWebViewLoadingTrue).toBe('function');
        });
    });

    describe("edge cases and error handling", () => {
        it("should handle case when webView is null", () => {
            // Arrange
            component.webView = null;
            const testUrl = "https://example.com/promotion";

            // Act & Assert - should not throw
            expect(() => component.loadFreeSpinsPromotionSite(testUrl)).not.toThrow();
        });

        it("should handle undefined promotionUrl", () => {
            // Act
            component.loadFreeSpinsPromotionSite(undefined);

            // Assert
            expect(component.hideWebView).not.toHaveBeenCalled();
            expect(mockWebView.url).toBe("");
        });
    });

    describe("loading state management", () => {
        it("should properly toggle between loading states", () => {
            // Initially not loading
            expect(mockNodeLoading.active).toBe(false);

            // Show loading
            component.showLoading();
            expect(mockNodeLoading.active).toBe(true);
            expect(component.changeWebViewLoadingTrue).toHaveBeenCalled();

            // Hide loading
            jest.clearAllMocks();
            component.hideLoading();
            expect(mockNodeLoading.active).toBe(false);
            expect(component.changeWebViewLoadingFalse).toHaveBeenCalled();
        });

        it("should handle different URL formats correctly", () => {
            const testUrls = [
                "https://example.com",
                "http://test.com/path?query=1",
                "/relative/path"
            ];

            testUrls.forEach(url => {
                // Arrange
                mockWebView.url = ""; // Reset
                jest.clearAllMocks();

                // Act
                component.loadFreeSpinsPromotionSite(url);

                // Assert
                expect(mockWebView.url).toBe(url);
                expect(component.hideWebView).toHaveBeenCalled();
            });
        });
    });
});
