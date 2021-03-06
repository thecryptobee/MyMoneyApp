import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  StatusBar,
  Alert,
  ImageBackground,
  RefreshControl
} from "react-native";
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Left,
  Right,
  Body,
  Text,
  List,
  ListItem,
  Thumbnail,
  Footer
} from "native-base";
import Icon from "react-native-vector-icons/FontAwesome";
import {
  MenuProvider,
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger
} from "react-native-popup-menu";
import DropdownAlert from "react-native-dropdownalert";

//TODO: Custome Pages
import { colors, images, localDB } from "../../../app/constants/Constants";
var dbOpration = require("../../../app/manager/database/DBOpration");
var utils = require("../../../app/constants/Utils");
import renderIf from "../../../app/constants/validation/renderIf";

let isNetwork;
//import styles from './Styles';

import { DotIndicator } from "react-native-indicators";

//TODO: Wallets
import WalletService from "../../../bitcoin/services/WalletService";

export default class AccountDetailsScreen extends React.Component {
  constructor(props) {
    super(props);
    StatusBar.setBackgroundColor(colors.appColor, true);
    this.state = {
      data: [],
      waletteData: [],
      tranDetails: [],
      refreshing: false,
      isLoading: false,
      isNoTranstion: false
    };
    isNetwork = utils.getNetwork();
  }  

  //TODO: Page Life Cycle
  componentWillMount() {
    const { navigation } = this.props;
    console.log("data =" + JSON.stringify(navigation.getParam("data")));   
    this.setState({
      data: navigation.getParam("data"),
      waletteData: navigation.getParam("privateKeyJson")[
        navigation.getParam("indexNo")
      ]
    });
  }

  componentDidMount() {
    this.willFocusSubscription = this.props.navigation.addListener(
      "willFocus",
      () => {
        isNetwork = utils.getNetwork();
        this.fetchloadData();
      }
    );
  }

  componentWillUnmount() {
    this.willFocusSubscription.remove();
  }

  //TODO: func loadData
  async fetchloadData() {
    this.setState({
      isLoading: true
    });
    const dateTime = Date.now();
    const lastUpdateDate = Math.floor(dateTime / 1000);
    const { navigation } = this.props;
    const resultAccount = await dbOpration.readAccountTablesData(
      localDB.tableName.tblAccount
    );  
    if (isNetwork) {
      const bal = await WalletService.getBalance(
        navigation.getParam("data").address
      );
      if (bal.statusCode == 200) {
        const resultRecentTras = await WalletService.getTransactions(
          navigation.getParam("data").address
        );
        if (resultRecentTras.statusCode == 200) {
          if (resultRecentTras.transactionDetails.length > 0) {
            const resultRecentTransaction = await dbOpration.insertTblTransation(
              localDB.tableName.tblTransaction,
              resultRecentTras.transactionDetails,
              resultRecentTras.address,
              lastUpdateDate
            );
            if (resultRecentTransaction) {
              this.fetchRecentTransaction(navigation.getParam("data").address);
            }
          } else {
            this.setState({
              isNoTranstion: true
            });
          }
          const resultUpdateTblAccount = await dbOpration.updateTableData(
            localDB.tableName.tblAccount,
            bal.final_balance / 1e8,
            navigation.getParam("data").address,
            lastUpdateDate
          );
          if (resultUpdateTblAccount) {
            this.setState({
              data: resultAccount.temp[navigation.getParam("indexNo")],
              isLoading: false
            });
          }
        } else {
          this.dropdown.alertWithType(
            "error",
            "OH!!",
            resultRecentTras.errorMessage
          );
        }
      }
    } else {
      this.fetchRecentTransaction(navigation.getParam("data").address);
      this.setState({
        data: resultAccount.temp[navigation.getParam("indexNo")],
        isLoading: false
      });
    }
  }

  //TODO: func fetchRecentTransaction
  async fetchRecentTransaction(address) {
    let transation;
    let flag_noTrasation;
    const resultRecentTras = await dbOpration.readRecentTransactionAddressWise(
      localDB.tableName.tblTransaction,
      address
    );
    if (resultRecentTras.temp.length > 0) {
      transation = resultRecentTras.temp;
      flag_noTrasation = false;
    } else {
      transation = [];
      flag_noTrasation = true;
    }
    this.setState({
      tranDetails: transation,
      isNoTranstion: flag_noTrasation
    });
  }

  //TODO: func refresh
  refresh() {
    this.setState({ refreshing: true });
    return new Promise(resolve => {
      setTimeout(() => {
        this.setState({ refreshing: false });
        this.fetchloadData();
        resolve();
      }, 1000);
    });
  }
  //TODO: func openRecentTrans
  openRecentTrans(item) {
    this.props.navigation.navigate("RecentTransactionsScreen", {
      transationDetails: item
    });
  }

  render() {
    return (
      <Container style={styles.container}>
        <Content
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.refresh.bind(this)}
            />
          }
        >
          <ImageBackground
            source={images.accounts[this.state.data.accountType]}
            style={styles[this.state.data.accountType]}
            borderRadius={10}
            imageStyle={{
              resizeMode: "cover" // works only here!
            }}
          >
            <View style={styles.viewBackBtn}>
              <Left>
                <Button
                  transparent
                  onPress={() => this.props.navigation.goBack()}
                >
                  <Icon name="chevron-left" size={25} color="#ffffff" />
                </Button>
              </Left>
              <Right>
                <MenuProvider>
                  <Menu style={{ marginTop: 10, color: "#ffffff" }}>
                    <MenuTrigger
                      customStyles={{
                        triggerText: { fontSize: 18, color: "#fff" }
                      }}
                      text="options"
                    />
                    <MenuOptions customStyles={{ optionText: styles.text }}>
                      <MenuOption onSelect={() => alert(`Save`)} text="Save" />
                      <MenuOption onSelect={() => alert(`Delete`)}>
                        <Text style={{ color: "red" }}>Delete</Text>
                      </MenuOption>
                    </MenuOptions>
                  </Menu>
                </MenuProvider>
              </Right>
            </View>
            <View style={styles.viewBalInfo}>
              <Text style={[styles.txtTile, styles.txtAccountType]}>
                {this.state.data.accountType}
              </Text>
              <View style={{ flexDirection: "row" }}>
                <Text style={[styles.txtTile, styles.txtBalInfo]}>
                  {this.state.data.balance + " "}
                </Text>
                <Text style={[styles.txtTile, styles.txtBalInfo]}>
                  {this.state.data.unit}
                </Text>
              </View>
            </View>
          </ImageBackground>
          <View style={styles.viewMainRecentTran}>
            <View style={styles.viewTitleRecentTrans}>
              <Text style={styles.txtRecentTran}>Recent Transactions</Text>
              {renderIf(this.state.isLoading)(
                <View style={styles.loading}>
                  <DotIndicator size={5} color={colors.appColor} />
                </View>
              )}
            </View>
            <View style={styles.recentTransListView}>
              {renderIf(this.state.isNoTranstion)(
                <View style={styles.viewNoTransaction}>
                  <Thumbnail
                    source={require("../../../assets/images/faceIcon/normalFaceIcon.png")}
                  />
                  <Text style={styles.txtNoTransaction} note>
                    No Transactions
                  </Text>
                </View>
              )}
              {renderIf(this.state.tranDetails.length != 0)(
                <View style={styles.recentTransListView}>
                  <FlatList
                    data={this.state.tranDetails}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <List>
                        <ListItem
                          thumbnail
                          onPress={() => this.openRecentTrans(item)}
                        >
                          <Left>
                            <Thumbnail
                              source={require("../../../assets/images/bitcoinLogo.jpg")}
                            />
                          </Left>
                          <Body>
                            <Text style={styles.txtTransTitle}>
                              {item.transactionType}{" "}
                              <Text style={styles.txtConfimation}>
                                {item.confirmationType}{" "}
                              </Text>{" "}
                            </Text>
                            <Text note numberOfLines={1}>
                              {utils.getUnixToDateFormat(item.dateCreated)}
                            </Text>
                          </Body>
                          <Right>
                            {renderIf(item.transactionType == "Sent")(
                              <Text style={styles.txtAmoundSent}>
                                - {item.balance / 1e8}
                              </Text>
                            )}
                            {renderIf(item.transactionType == "Received")(
                              <Text style={styles.txtAmoundRec}>
                                + {item.balance / 1e8}
                              </Text>
                            )}
                          </Right>
                        </ListItem>
                      </List>
                    )}
                    keyExtractor={item => item.hash}
                  />
                </View>
              )}
            </View>
          </View>
          <View style={styles.viewFooter}>
            <View
              style={{
                backgroundColor: colors.appColor,
                flexDirection: "row",
                paddingLeft: 20,
                paddingRight: 10,
                borderRadius: 5
              }}
            >
              <Button
                transparent
                onPress={() => {
                  if (isNetwork) {
                    this.props.navigation.push("SentMoneyScreen", {
                      data: this.state.data,
                      address: this.state.data.address,
                      privateKey: this.state.waletteData.privateKey
                    });  
                  } else {
                    this.dropdown.alertWithType(
                      "info",
                      "OH!!",
                      "Sorry You're Not Connected to the Internet"
                    );
                  }
                }}
              >
                <Icon name="angle-up" size={25} color="#ffffff" />
                <Text style={styles.txtTile}>Send</Text>
              </Button>
              <Button
                transparent
                onPress={() =>
                  this.props.navigation.push("ReceiveMoneyScreen", {
                    address: this.state.data.address
                  })
                }
              >
                <Icon name="angle-down" size={25} color="#ffffff" />
                <Text style={styles.txtTile}>Receive</Text>
              </Button>
            </View>
          </View>
        </Content>
        <DropdownAlert ref={ref => (this.dropdown = ref)} />
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  Savings: {
    flex: 1,
    backgroundColor: colors.Saving,
    width: "100%"
  },
  Secure: {
    flex: 1,
    backgroundColor: colors.Secure,
    width: "100%"
  },
  viewBackBtn: {
    flex: 2,
    flexDirection: "row",
    padding: 15,
    marginTop: Platform.OS == "ios" ? 10 : 25
  },
  viewBalInfo: {
    flex: 5,
    flexDirection: "column",

    padding: 15
  },
  //txtbal info
  txtTile: {
    color: "#ffffff"
  },
  txtAccountType: {
    fontSize: 20,
    fontWeight: "bold"
  },
  txtBalInfo: {
    fontSize: 28,
    fontWeight: "bold"
  },
  //Recent Transaction
  viewMainRecentTran: {
    flex: 2
  },
  viewTitleRecentTrans: {
    marginLeft: 20,
    flexDirection: "row",
    flex: 0.2,
    alignItems: "center"
  },
  //Loading
  loading: {
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    alignContent: "center"
  },
  txtRecentTran: {
    fontWeight: "bold",
    fontSize: 25,
    marginTop: 10
  },
  txtTransTitle: {
    fontWeight: "bold",
    marginBottom: 5
  },
  txtAmoundRec: {
    color: "#228B22",
    fontWeight: "bold"
  },
  txtAmoundSent: {
    color: "red",
    fontWeight: "bold"
  },
  recentTransListView: {
    flex: 1
  },
  //No Transaction
  viewNoTransaction: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20
  },
  txtNoTransaction: {
    fontSize: 20,
    fontWeight: "bold",
    paddingTop: 5
  },
  //TODO:Fotter view
  viewFooter: {
    flex: 0.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  txtConfimation: {
    fontSize: 10,
    color: "gray"
  },
  //PopupMenu
  text: {
    fontSize: 18
  }
});
