import { requestWidgetUpdate, WidgetTaskHandlerProps } from "react-native-android-widget";
import { DepartureWidget } from "./HelloWidget";
import { getNextService } from "../services/apiService";
import { lineAbbreviation, lineColour } from "../data/titleAttributes";
import { getItem } from "../utils/AsyncStorage";

const nameToWidget = {
    // Hello will be the **name** with which we will reference our widget.
    Departure: DepartureWidget,
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

// load user selected line, station and get departures for them.
async function loadWidgetData() {
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

    console.log(userLine);
    console.log(lineColour.get(userLine));

    const lineAbbr = lineAbbreviation.get(userLine);
    const lineAbbrColour = lineColour.get(userLine);

    return { userLine, userStop, departures, lineAbbr, lineAbbrColour };
}

export async function widgetTaskHandler(props) {
    const widgetInfo = props.widgetInfo;
    const Widget =
        nameToWidget[widgetInfo.widgetName];
    
    let widgetData = await loadWidgetData();

    switch (props.widgetAction) {
        case 'WIDGET_ADDED':
            props.renderWidget(
                <Widget 
                    lineAbbr={widgetData.lineAbbr} 
                    lineName={widgetData.userLine}
                    stopName={widgetData.userStop}
                    departures={widgetData.departures}
                    colour={widgetData.lineAbbrColour}
                />
            );
            break;
    
        case 'WIDGET_UPDATE':
            // Not needed for now
            break;
    
        case 'WIDGET_RESIZED':
            props.renderWidget(
                <Widget 
                    lineAbbr={widgetData.lineAbbr} 
                    lineName={widgetData.userLine}
                    stopName={widgetData.userStop}
                    departures={widgetData.departures}
                    colour={widgetData.lineAbbrColour}
                />
            );
            break;
    
        case 'WIDGET_DELETED':
            // Not needed for now
            break;
    
        case 'WIDGET_CLICK':
            if (props.clickAction === 'REFRESH_CLICK') {
                widgetData = await loadWidgetData();

                requestWidgetUpdate({
                    widgetName: widgetInfo.widgetName,
                    renderWidget: () => <Widget 
                        lineAbbr={widgetData.lineAbbr}
                        lineName={widgetData.userLine}
                        stopName={widgetData.userStop}
                        departures={widgetData.departures}
                        colour={widgetData.lineAbbrColour}
                    />
                });
            }
            break;
    
        default:
            break;
        }
}