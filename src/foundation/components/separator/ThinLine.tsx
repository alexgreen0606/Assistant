import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Colors from '../../theme/colors';

const ThinLine = () =>
    <View style={styles.lineContainer}>
        <View style={styles.thinLine} />
    </View>


const styles = StyleSheet.create({
    thinLine: {
        width: '100%',
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.GREY,
    },
    lineContainer: {
        width: '100%',
        height: 15,
        backgroundColor: 'transparent',
        justifyContent: 'center'
    },
});

export default ThinLine;
