// import { HardhatUserConfig } from "hardhat/config";
// import "@nomicfoundation/hardhat-toolbox";
require('dotenv').config();
require("@nomicfoundation/hardhat-ethers");

const { API_URL, METAMASK_PRIVATE_KEY, oklink } = process.env;


// module.exports = {
//   solidity: "0.8.18",
//   networks: {
//     goerli: {
//       url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
//       accounts: [process.env.PRIVATE_KEY],
//     },
//   },
// };






// module.exports = {
//    solidity: "0.8.20",
//    defaultNetwork: "polygonAmoy",
//    networks: {
//       hardhat: {},
//       amoy: {
//          url: API_URL,
//          accounts: [`0x${METAMASK_PRIVATE_KEY}`],
//          timeout: 20000   
//       }
//    },
// }


module.exports = {
   solidity: {
     compilers: [
       {
         version: "0.8.20",
         settings: {
           optimizer: {
             enabled: true,
             runs: 200,
           },
         },
       },
     ],
   },
   sourcify: {
     enabled: false,
   },
   networks: {
     polygonAmoy: {
       url: API_URL,
       accounts: [`0x${METAMASK_PRIVATE_KEY}`],
       gasPrice: "auto",
     },
   },
   etherscan:{
    apiKey: {
      PolygonAmoy: oklink,
    },
    customChains: [
      {
        network: "PolygonAmoy",
        chainId:80002,
        urls:{
          apiURL:"https://www.oklink.com/api/explorer/v1/contract/verify/async/api/polygonAmoy",
          browserURL:"https://www.oklink.com/polygonAmoy",
        }
      }
    ]
    }
  };