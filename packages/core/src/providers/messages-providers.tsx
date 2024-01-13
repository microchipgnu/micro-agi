import { ReactNode, createContext, useContext, useReducer } from "react";
import { Message, MessageAction, MessageState } from "../types";

const MessageContext = createContext<
  | {
      state: MessageState;
      dispatch: React.Dispatch<MessageAction>;
      addMessage: (message: Message) => void;
    }
  | undefined
>(undefined);

const MessageReducer = (
  state: MessageState,
  action: MessageAction
): MessageState => {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...(state.messages || []), action.payload],
      };
    default:
      return state;
  }
};

export const MessageProvider: React.FC<
  MessageState & { children: ReactNode }
> = (props: MessageState & { children: ReactNode }) => {
  const { children, ...restProps } = props;
  const [state, dispatch] = useReducer(MessageReducer, {
    ...restProps,
  });

  const addMessage = (message: Message) => {
    dispatch({ type: "ADD_MESSAGE", payload: message });
  };

  return (
    <MessageContext.Provider value={{ state, dispatch, addMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = (): {
  state: MessageState;
  dispatch: React.Dispatch<MessageAction>;
  addMessage: (message: Message) => void;
} => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within a MessageProvider");
  }
  return context;
};
