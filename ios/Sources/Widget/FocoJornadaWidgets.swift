import SwiftUI
import WidgetKit

@main
struct FocoJornadaWidgets: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        JourneyLiveActivityWidget()
        if #available(iOS 26.0, *) {
            AlarmCountdownLiveActivityWidget()
        }
    }
}
