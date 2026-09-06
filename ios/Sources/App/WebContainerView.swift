import SwiftUI
import UIKit
import WebKit

struct WebContainerView: UIViewRepresentable {
    static let appURL = URL(string: "https://allyssonestadulho92.github.io/Foco-Jornada/")!
    static let allowedHost = "allyssonestadulho92.github.io"
    static let bridgeName = "focoJornadaTimer"

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = false
        configuration.userContentController.add(context.coordinator, name: Self.bridgeName)

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.load(URLRequest(url: Self.appURL, cachePolicy: .useProtocolCachePolicy))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: Self.bridgeName)
        webView.navigationDelegate = nil
    }

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard message.name == WebContainerView.bridgeName,
                  message.frameInfo.isMainFrame,
                  message.frameInfo.securityOrigin.host == WebContainerView.allowedHost,
                  message.frameInfo.securityOrigin.protocol == "https" else {
                return
            }

            do {
                let payload = try TimerBridgePayload.decode(messageBody: message.body)
                Task { @MainActor in
                    await NativeTimerCoordinator.shared.apply(payload)
                }
            } catch {
                // Mensagens inválidas são descartadas; não existe execução arbitrária no bridge.
            }
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if url.scheme == "about" {
                decisionHandler(.allow)
                return
            }

            if url.scheme == "https", url.host == WebContainerView.allowedHost {
                decisionHandler(.allow)
                return
            }

            if url.scheme == "http" || url.scheme == "https" {
                UIApplication.shared.open(url)
            }
            decisionHandler(.cancel)
        }
    }
}
