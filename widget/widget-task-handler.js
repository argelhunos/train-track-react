import { WidgetTaskHandlerProps } from "react-native-android-widget";
import { HelloWidget } from "./HelloWidget";
import { getNextService } from "../services/apiService";
import { lineAbbreviation } from "../data/titleAttributes";
import { getItem } from "../utils/AsyncStorage";

const nameToWidget = {
    // Hello will be the **name** with which we will reference our widget.
    Hello: HelloWidget,
};

async function getDepartures() {
    try {
        const departures = await getNextService();
        return departures;
    } catch (error) {
        console.error("An error has occurred: " + error);
        return [];
    }
}

export async function widgetTaskHandler(props) {
    const widgetInfo = props.widgetInfo;
    const Widget =
        nameToWidget[widgetInfo.widgetName];
    let userLine = "";
    let userStop = "";
    let departures = [];

    try {
        userLine = await getItem('line');
        userStop = await getItem('stop');
        departures = await getDepartures();
    } catch (error) {
        console.error("An error has occurred: " + error);
    }

    const lineAbbr = await lineAbbreviation.get(userLine);

    switch (props.widgetAction) {
        case 'WIDGET_ADDED':
            props.renderWidget(
                <Widget 
                    lineAbbr={lineAbbr} 
                    lineName={userLine}
                    stopName={userStop}
                    departures={departures}
                />
            );
            console.log("done!");
            break;
    
        case 'WIDGET_UPDATE':
            // Not needed for now
            break;
    
        case 'WIDGET_RESIZED':
            // Not needed for now
            break;
    
        case 'WIDGET_DELETED':
            // Not needed for now
            break;
    
        case 'WIDGET_CLICK':
            // Not needed for now
            break;
    
        default:
            break;
        }
}