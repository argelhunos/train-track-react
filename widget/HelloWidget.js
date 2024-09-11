import React from 'react';
import { FlexWidget, TextWidget, ImageWidget, ListWidget } from 'react-native-android-widget';

export function HelloWidget({ msg }) {
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
                    text={msg}
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
                    text="Kitchener"
                    style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                    }}
                ></TextWidget>
                <TextWidget text='@ Bloor GO'></TextWidget>
            </FlexWidget>
            <ListWidget
                style={{
                    width: 'match_parent',
                    height: 'match_parent',
                    marginTop: 10,
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
                        text='17:23 - to Georgetown GO'
                        style={{
                            fontSize: 15
                        }}
                    ></TextWidget>
                    <TextWidget 
                        text='Platform 3 | 10 Coaches'
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
                <FlexWidget
                    style={{
                        backgroundColor: '#EEEAE3',
                        width: 'match_parent',
                        padding: 10,
                        borderRadius: 10,
                        flexDirection: 'column',
                        marginVertical: 20,
                    }}
                >
                    <TextWidget 
                        text='17:23 - to Georgetown GO'
                        style={{
                            fontSize: 15
                        }}
                    ></TextWidget>
                    <TextWidget 
                        text='Platform 3 | 10 Coaches'
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
                <FlexWidget
                    style={{
                        backgroundColor: '#EEEAE3',
                        width: 'match_parent',
                        padding: 10,
                        borderRadius: 10,
                        flexDirection: 'column',
                        marginVertical: 20,
                    }}
                >
                    <TextWidget 
                        text='17:23 - to Georgetown GO'
                        style={{
                            fontSize: 15
                        }}
                    ></TextWidget>
                    <TextWidget 
                        text='Platform 3 | 10 Coaches'
                        style={{
                            fontSize: 15
                        }}
                    ></TextWidget>
                </FlexWidget>
            </ListWidget>
        </FlexWidget>
    );
}