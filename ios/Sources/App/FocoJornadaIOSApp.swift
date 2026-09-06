import SwiftUI

@main
struct FocoJornadaIOSApp: App {
    var body: some Scene {
        WindowGroup {
            WebContainerView()
                .ignoresSafeArea(.container, edges: .bottom)
        }
    }
}
