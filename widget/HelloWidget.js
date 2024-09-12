import React from 'react';
import { FlexWidget, TextWidget, ImageWidget, ListWidget } from 'react-native-android-widget';

export function HelloWidget({ lineAbbr, lineName, stopName, departures }) {
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
            }}
        >
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGap: 5,
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
                        backgroundColor: '#00863E',
                        fontWeight: '800',
                        paddingHorizontal: 10,
                        paddingVertical: 2,
                        fontSize: 15,
                        borderRadius: 10,
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
            <ListWidget
                style={{
                    width: 'match_parent',
                    height: 'match_parent',
                    marginTop: 10,
                }}
            >
                {departures.map((departure, index) =>
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
                )}
            </ListWidget>
        </FlexWidget>
    );
}