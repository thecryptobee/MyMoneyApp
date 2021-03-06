import React from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Alert,
    ImageBackground,
    Clipboard,
    DeviveEventEmitter
} from 'react-native';
import { Container, Header, Title, Content, Button, Left, Right, Footer, FooterTab, Body, Text } from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-simple-toast';
import BarcodeScanner from 'react-native-barcode-scanners'
import ImagePicker from 'react-native-image-picker';
const options = {
    title: 'Select Avatar',
    customButtons: [{ name: 'fb', title: 'Choose Photo from Facebook' }],
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },  
};     

//TODO: Custome Pages
import { colors, images, localDB } from "../../../../app/constants/Constants";



export default class QrcodeScannerScreen extends React.Component {
    constructor(props) {  
        super(props);
        this.state = ({
            address: '',
        });
        
    }

    onBarCodeRead(res:any) {
        //this.props.navigation.goBack();
        const { navigation } = this.props;
        navigation.goBack();
        navigation.state.params.onSelect({ barcode: res.data });
    }

    onReadBarCodeByGalleryFailure() {
        Alert.alert('Note', 'Not found Qrcode!')
    }

    render() {  
        return (
            <Container>
                <Content contentContainerStyle={styles.container}>
                    <BarcodeScanner
                        Title={'QRCode Scanner'}
                        styles={styles.barcodeScanner}
                        cameraProps={{captureAudio: false}}
                        onBack={() => this.props.navigation.goBack()}  
                        onBarCodeReadByGalleryStart={(data) => this.onBarCodeRead.call(this, data)}
                        onReadBarCodeByGalleryFailure={() => this.onReadBarCodeByGalleryFailure.call(this)}
                        onBarCodeRead={(data) => this.onBarCodeRead.call(this, data)}
                    />
                </Content>
            </Container>
        );
    }
}




const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 20,
    },
});
