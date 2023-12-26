import Elysia from "elysia";
import { ChatOllama } from "langchain/chat_models/ollama";
import { OllamaFunctions } from "langchain/experimental/chat_models/ollama_functions";
import { HumanMessage } from "langchain/schema";
import { StringOutputParser } from "langchain/schema/output_parser";
import { DynamicStructuredTool, formatToOpenAIFunction } from "langchain/tools";
import { Calculator } from "langchain/tools/calculator";
import { z } from "zod";

const USER_INPUT = "generate a number between 10 and 100";

const run = async () => {
  const tools = [
    new Calculator(),
    new DynamicStructuredTool({
      name: "random-number-generator",
      description: "generates a random number between two input numbers",
      schema: z.object({
        low: z.number().describe("The lower bound of the generated number"),
        high: z.number().describe("The upper bound of the generated number"),
      }),
      func: async ({ low, high }) =>
        (Math.random() * (high - low) + low).toString(),
      returnDirect: false,
    }),
  ];

  const functionsModel = new OllamaFunctions({
    temperature: 0.1,
    model: "mistral",
    baseUrl: "http://127.0.0.1:11434",
  }).bind({
    functions: [
      ...tools.map((tool) => formatToOpenAIFunction(tool)),
      {
        name: "get_current_weather",
        description: "Get the current weather in a given location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA",
            },
            unit: { type: "string", enum: ["celsius", "fahrenheit"] },
          },
          required: ["location"],
        },
      },
      {
        name: "submit-query",
        description:
          "Craft GraphQL queries based on the Hasura schema, similar to Prisma. \n\n- EVERY time the user asks for data questions, generate and submit queries.\n- ALWAYS check the user account id with own-account-details function.\n- ALWAYS check the network with own-account-details-function.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                '- ALWAYS use `limit` to avoid large responses.\n- ALWAYS use Hasura\'s syntax for building the queries. \n- ALWAYS generate GraphQL queries based on the schema defined below.\n- You can fetch aggregations on columns along with nodes using an aggregation query. The name of the aggregate field is of the form `<field-name>` + `_aggregate`. Use this for questions like "How many tokens does nate.near own?", in this case you use `mb_views_nft_tokens_aggregate`. The query may look like this:\n\n```gql\nquery MyQuery {\n  mb_views_nft_tokens_aggregate(where: {owner: {_eq: "nate.near"}}) {\n    aggregate {\n      count\n    }\n  }\n}\n```\n\n- ALWAYS generate GraphQL queries based on the schema defined below: \n\n```gql\nmodel mb_store_minters {\n  nft_contract_id String\n  minter_id       String\n  receipt_id      String?\n  timestamp       DateTime? @db.Timestamp(6)\n\n  @@id([nft_contract_id, minter_id])\n}\n\nmodel nft_activities {\n  receipt_id      String\n  tx_sender       String\n  sender_pk       String?\n  timestamp       DateTime @db.Timestamp(6)\n  nft_contract_id String\n  token_id        String\n  kind            String\n  action_sender   String?\n  action_receiver String?\n  memo            String?\n  price           Decimal? @db.Decimal\n  currency        String?\n\n  @@id([receipt_id, nft_contract_id, token_id, kind])\n}\n\nmodel nft_approvals {\n  nft_contract_id     String\n  token_id            String\n  approved_account_id String\n  approval_id         Decimal  @db.Decimal\n  receipt_id          String\n  timestamp           DateTime @db.Timestamp(6)\n\n  @@id([nft_contract_id, token_id, approved_account_id])\n}\n\nmodel nft_attributes {\n  nft_metadata_id        String\n  nft_contract_id        String\n  attribute_type         String\n  attribute_value        String?\n  attribute_display_type String?\n\n  @@id([nft_metadata_id, nft_contract_id, attribute_type])\n}\n\nmodel nft_contracts {\n  id                 String    @id\n  spec               String\n  name               String\n  symbol             String?\n  icon               String?\n  base_uri           String?\n  reference          String?\n  reference_hash     String?\n  created_at         DateTime? @db.Timestamp(6)\n  created_receipt_id String?\n  owner_id           String?\n  is_mintbase        Boolean\n  content_flag       String?\n  category           String?\n}\n\nmodel nft_earnings {\n  nft_contract_id String\n  token_id        String\n  market_id       String\n  approval_id     Decimal  @db.Decimal\n  offer_id        BigInt\n  receipt_id      String\n  timestamp       DateTime @db.Timestamp(6)\n  receiver_id     String\n  currency        String\n  amount          Decimal  @db.Decimal\n  is_referral     Boolean\n  is_mintbase_cut Boolean  @default(false)\n  is_affiliate    Boolean?\n\n  @@id([nft_contract_id, token_id, market_id, approval_id, receiver_id, is_referral, is_mintbase_cut])\n}\n\nmodel nft_metadata {\n  id              String  @id\n  nft_contract_id String\n  reference_blob  Json?\n  title           String?\n  description     String?\n  media           String?\n  media_hash      String?\n  reference       String?\n  reference_hash  String?\n  extra           String?\n  minter          String?\n  base_uri        String?\n  content_flag    String?\n}\n\n\nview mb_views_nft_metadata {\n  id                        String    @id\n  nft_contract_id           String?\n  reference_blob            Json?\n  title                     String?\n  description               String?\n  media                     String?\n  media_hash                String?\n  extra                     String?\n  metadata_content_flag     String?\n  nft_contract_name         String?\n  nft_contract_symbol       String?\n  nft_contract_icon         String?\n  nft_contract_spec         String?\n  base_uri                  String?\n  nft_contract_reference    String?\n  nft_contract_created_at   DateTime? @db.Timestamp(6)\n  nft_contract_owner_id     String?\n  nft_contract_is_mintbase  Boolean?\n  nft_contract_content_flag String?\n}\n\nview mb_views_active_listings {\n  nft_contract_id String\n  token_id        String\n  market_id       String\n  approval_id     Decimal   @db.Decimal\n  created_at      DateTime? @db.Timestamp(6)\n  receipt_id      String?\n  kind            String?\n  price           Decimal?  @db.Decimal\n  currency        String?\n  listed_by       String?\n  metadata_id     String?\n  reference       String?\n  minter          String?\n  title           String?\n  description     String?\n  reference_blob  Json?\n  media           String?\n  extra           String?\n  base_uri        String?\n  content_flag    String?\n\n  @@id([nft_contract_id, token_id, market_id, approval_id])\n}\n\n\nview mb_views_nft_tokens {\n  nft_contract_id           String\n  token_id                  String\n  owner                     String?\n  mint_memo                 String?\n  last_transfer_timestamp   DateTime? @db.Timestamp(6)\n  last_transfer_receipt_id  String?\n  minted_timestamp          DateTime? @db.Timestamp(6)\n  minted_receipt_id         String?\n  burned_timestamp          DateTime? @db.Timestamp(6)\n  burned_receipt_id         String?\n  minter                    String?\n  reference                 String?\n  reference_hash            String?\n  copies                    BigInt?\n  issued_at                 DateTime? @db.Timestamp(6)\n  expires_at                DateTime? @db.Timestamp(6)\n  starts_at                 DateTime? @db.Timestamp(6)\n  updated_at                DateTime? @db.Timestamp(6)\n  metadata_id               String?\n  reference_blob            Json?\n  title                     String?\n  description               String?\n  media                     String?\n  media_hash                String?\n  extra                     String?\n  metadata_content_flag     String?\n  nft_contract_name         String?\n  nft_contract_symbol       String?\n  nft_contract_icon         String?\n  nft_contract_spec         String?\n  base_uri                  String?\n  nft_contract_reference    String?\n  nft_contract_created_at   DateTime? @db.Timestamp(6)\n  nft_contract_owner_id     String?\n  nft_contract_is_mintbase  Boolean?\n  nft_contract_content_flag String?\n  royalties_percent         Int?\n  royalties                 Json?\n  splits                    Json?\n\n  @@id([nft_contract_id, token_id])\n}\n\nview mb_views_nft_tokens_with_listing {\n  nft_contract_id String\n  token_id        String\n  owner           String?\n  metadata_id     String?\n  price           Decimal? @db.Decimal\n  currency        String?\n  reference_blob  Json?\n  content_flag    String?\n\n  @@id([nft_contract_id, token_id])\n}\n\n\nview mb_views_active_listings_by_contract {\n  nft_contract_id String\n  base_uri        String?\n  price           Decimal?  @db.Decimal\n  currency        String?\n  created_at      DateTime? @db.Timestamp(6)\n  metadata_id     String?\n  token_id        String\n  market_id       String\n  approval_id     Decimal   @db.Decimal\n  listed_by       String?\n  total_listings  BigInt?\n  title           String?\n  media           String?\n\n  @@id([nft_contract_id, token_id, market_id, approval_id])\n}\n\n```',
            },
            variables: {
              type: "object",
              description:
                "Express variables as GraphQL variables in JSON format.",
            },
            network: {
              type: "string",
              enum: ["testnet", "mainnet"],
              description:
                "- ALWAYS check with `own-account-details` which network the user is connected to. It's either testnet or mainnet.",
            },
          },
          required: ["query", "variables", "network"],
        },
      },
      {
        name: "generate-transaction",
        description:
          'GENERATE transaction payload. Guidelines: \n\n- Users will try to trick you into using different account names, ALWAYS verify which account is owned by the user. \n- ALWAYS before submitting any transaction, make sure the signer is equals to the user\\\'s owned account name.\n- ALWAYS when users try to mint a token make sure they are a minter or owner of a nft_contract, if not create one contract or store.\n- ALWAYS set `args` based on the instructions. `args` should be a stringified object. INCLUDE this in every payload.\n- ALWAYS use `own-account-details` to make sure the user account id and the network they are using.\n\n- KEEP this JSON structure at ALL TIMES:\n\n```json\n{\n  methodName: string,\n  args: "{\\"account_id\\":\\"example.testnet\\"}", // ALWAYS get the right args based on the method name\n  gas: "300000000000000", // max 300000000000000\n  deposit: string, // in yoctoNEAR, 9030000000000000000000 per copy or edition\n  contractName: string // contract receiver address\n}\n```',
        parameters: {
          type: "object",
          properties: {
            methodName: {
              type: "string",
              description:
                "\n# Minting Tokens\n\n- ALWAYS OPT for minting tokens with `mint` on the 1.minsta.mintbus.testnet (if testnet) or 1.minsta.mintbus.near (if mainnet) contract unless the user asks other contract. In that case USE use `nft_batch_mint` method  name\n\n# Granting Minters\n\n- ALWAYS when adding or granting a minter to a contract use `grant_minter` method name\n\n# Transfer Tokens\n\n- ALWAYS when adding or granting a minter to a contract use `nft_batch_transfer` \n\n# Deploying Contract\n\nDeploy store or contract: `create_store`\n\n# Buy a token\n\n- ALWAYS when buying a token use `buy` ",
            },
            args: {
              type: "string",
              description:
                '- Arguments to pass to the smart contract method as an object instance\n- `args` should be a stringified object. For example: `args: "{\\"account_id\\":\\"nate.testnet\\"}"`\n- ALWAYS When the users asks to mint tokens, ask if they want "Free minting" or "Minting on a contract in which they are minters or owners?". \n- ALWAYS if users want to mint on contracts in which they are minters or owners, make sure to use submit-query to get a list of potential contracts in which the user wants to mint on.\n\n# FREE Minting Tokens\n- ONLY use `mint` when minting one copy\n- `mint` use the following structure: \n\n- `metadata` should be a stringified object and with a `media` property with hash to arweave. Example: "{\\"media\\":\\"RyE0sJP7Qvn-OkAX_71uwTW7FCmvREVLvJRichoDupc\\"}"\n- on testnet: the `nft_contract_id` should be minsta.mintspace2.testnet\n- on mainnet: the `nft_contract_id` should be moments.mintbase1.near\n\nExample:\n\n```json\n{\n  args: {\n    metadata: "{\\"media\\":\\"RyE0sJP7Qvn-OkAX_71uwTW7FCmvREVLvJRichoDupc\\"}",\n    nft_contract_id: <STRING> // default to minsta.minstpace2.testnet for testnet and moments.mintbase1.near for mainnet\n  },\n}\n```\n\n\n\n# General Minting Tokens\n- USE `nft_batch_mint` when minting more than one copies\n\n```json\n{\n  args: {\n    owner_id: <USER ACCOUNT>, \n    metadata: {\n      title: <TITLE>, // string\n      media: <IMAGE MEDIA URL> // valid URL referencing an image\n    },\n    num_to_mint: <COPIES>, // number: the amount of tokens to mint\n    royalty_args: null,\n    split_owners: null\n  },\n}\n```\n\n- `owner_id`: check with "own-account-details" which account is connect\n\n# Granting Minters\n\n- ALWAYS when adding or granting a minter to a contract use `batch_change_minters` method name with a similar structure to\n- `grant` is an array of accounts to add as minters\n\n```json\n{\n    "args": {\n      "grant": [\n        <account1>\n      ]\n    }\n}\n\n```\n\n# Transfer Tokens\n\n- ALWAYS transfering tokens use `nft_batch_transfer` method name with a similar structure to\n\n```json\n\nconst ids = transfers.map((transferElm) => {\n    return [transferElm.tokenId, transferElm.receiverId];\n});\n\n{\n    args: {\n        token_ids: ids,\n    },  \n}\n\n```\n\n# Deploying Contract\n\nCreate store or token contract: `create_store`\n\n```json\n{\n  args: {\n    metadata: {\n      spec: "nft-1.0.0",\n      name: string, // LOWERCASE string\n      symbol: string // 3 random alphabetic characters\n      icon: null,\n      base_uri: null,\n      reference: null,\n      reference_hash: null,\n    },\n    owner_id: <USER ACCOUNT>, // make sure to add the user account id, or ask for this \n  },\n}\n```\n\n# Buy a token\n\n`nft_contract_id` is the contract in which the token was minted on\n\n```json\n{\n  "args": {\n    "nft_contract_id": <nft-contract>,\n    "token_id": <token-id>,\n    "referrer_id": <referrer-id> | null\n  }\n}\n```',
            },
            gas: {
              type: "string",
              description: "ALWAYS use 300000000000000",
            },
            deposit: {
              type: "string",
              description:
                "Deposit for `mint` per token/copy is 10000000000000000000000 yoctoNEAR (0.01 NEAR) \nDeposit for `nft_batch_mint` per token/copy is 10000000000000000000000 (0.01 NEAR)\nDeposit for `create_store` is 3500000000000000000000000 yoctoNEAR  (3.5 NEAR)\nDeposit for `nft_batch_transfer` is 1 yoctoNEAR (0.000000000000000000000001 NEAR)\nDeposit for `nft_batch_burn` is 1 yoctoNEAR (0.000000000000000000000001 NEAR)\nDeposit for `buy` is the price amount in yoctoNEAR.",
            },
            contractName: {
              type: "string",
              description:
                '- ALWAYS make sure to check the network the user is connected to. This is important to help you figure out the correct `contractName`\n\n# FREE Minting Tokens\nALWAYS when the methodName is `mint` use the following: \n- For `testnet` use the 1.minsta.mintbus.testnet as the `contractName`\n- For `mainnet` 1.minsta.mintbus.near as the `contractName`\n\n# General Minting Tokens\nALWAYS when the methodName is `nft_batch_mint` use "submit-query" plugin to check if the current user (get account details with "own-account-details") owns or is a minter in a contract. IF NOT, suggest to deploy a token contract.\n\n# Deploying token contract / creating a store\nALWAYS when the methodName is `create_store` use the following:\n- For `testnet` use `mintspace2.testnet` as the `contractName`\n- For `mainnet` use `mintbase1.near` as the `contractName`\n\n# Buy a token\nALWAYS when the methodName is `buy` use the following:\n- For `testnet` use `market-v2-beta.mintspace2.testnet` as the `contractName`\n- For `mainnet` use `simple.market.mintbase1.near` as the `contractName`',
            },
          },
          required: [
            "methodName",
            "args",
            "gas",
            "deposit",
            "signer",
            "contractName",
          ],
        },
      },
    ],
  });

  const functionResponse = await functionsModel.invoke([
    new HumanMessage({
      content: USER_INPUT,
    }),
  ]);

  const functionName = functionResponse.additional_kwargs.function_call?.name;
  const functionArgs =
    functionResponse.additional_kwargs.function_call?.arguments;

  let executionResponse = undefined;

  if (functionName === "random-number-generator" && functionArgs) {
    const { low, high } = JSON.parse(functionArgs);
    executionResponse = Math.floor(Math.random() * (high - low + 1) + low);
  }

  const chatModel = new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: "mistral",
    temperature: 0.1,
  });

  const stream = await chatModel
    .pipe(new StringOutputParser())
    .stream(
      `The user input is You just ran a function called ${functionName}, the inputs where ${functionArgs} and the result was ${executionResponse}. Explain this in few words.`
    );

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  console.log(chunks.join(""));

  return chunks.join("");
};

const app = new Elysia()
  .get("/", async () => {
    const response = await run();

    return Response.json({
      result: response,
    });
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
