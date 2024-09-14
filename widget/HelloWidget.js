import React from 'react';
import { FlexWidget, TextWidget, ImageWidget, ListWidget } from 'react-native-android-widget';

//TODO: maybe make these into separate react components? idk its a small widget

export function DepartureWidget({ lineAbbr, lineName, stopName, departures, colour }) {
    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                justifyContent: 'flex-start',
                backgroundColor: '#ffffff',
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingTop: 20,
                flexDirection: 'row',
                flexGap: 10,
            }}
            clickAction='OPEN_APP'
        >
            <FlexWidget
                style={{
                    flexDirection: 'column',
                    height: 'match_parent',
                    flexGap: 10,
                }}
            >
                <FlexWidget
                    style={{
                        flex: 2,
                    }}
                >
                    <ImageWidget 
                        image={require('../assets/train.png')}
                        imageWidth={35}
                        imageHeight={35}
                    />
                    <TextWidget
                        text={lineAbbr}
                        style={{
                            color: 'white',
                            backgroundColor: colour,
                            fontWeight: '800',
                            paddingHorizontal: 10,
                            paddingVertical: 1,
                            fontSize: 15,
                            borderRadius: 15,
                        }}
                    ></TextWidget>
                    <TextWidget 
                        text={lineName}
                        style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                        }}
                    ></TextWidget>
                    <TextWidget text={`@ ${stopName}`}></TextWidget>
                </FlexWidget>
                <FlexWidget
                    style={{
                        flex: 1
                    }}
                >
                    <ImageWidget 
                        image={require('../assets/refresh.png')}
                        imageWidth={25}
                        imageHeight={25}
                        clickAction='REFRESH_CLICK'
                        clickActionData={{ id: 0 }}
                    />
                </FlexWidget>
            </FlexWidget>
            <ListWidget
                style={{
                    width: 'match_parent',
                    height: 'match_parent',
                }}
            >
                {departures.length != 0 ? departures.map((departure, index) =>
                    <FlexWidget 
                        key={index}
                        style={{
                            width: 'match_parent'
                        }}
                    >
                        <FlexWidget
                            style={{
                                backgroundColor: '#EEEAE3',
                                width: 'match_parent',
                                padding: 10,
                                borderRadius: 10,
                                flexDirection: 'column',
                            }}
                        >
                            <TextWidget
                                text={`${departure.DisplayedDepartureTime} - to ${departure.DirectionName}`}
                                style={{
                                    fontSize: 15
                                }}
                            ></TextWidget>
                            <TextWidget
                                text={`Platform ${departure.ScheduledPlatform}`}
                                style={{
                                    fontSize: 15
                                }}
                            ></TextWidget>
                        </FlexWidget>
                        <FlexWidget
                                style={{
                                    height: 5,
                                    width: 'match_parent'
                                }}
                            ></FlexWidget>
                    </FlexWidget> 
                ) : <TextWidget text='No departures found.'/>}
            </ListWidget>
        </FlexWidget>
    );
}