import { ReactNode, createContext, useContext, useReducer } from "react";

export type Cache = Record<string, any>;

export type CacheState = Cache;

export type MessageAction =
  | {
      type: "ADD";
      payload: {
        key: string;
        value: any;
      };
    }
  | {
      type: "READ";
      payload: string;
    };

const CacheContext = createContext<
  | {
      state: CacheState;
      dispatch: React.Dispatch<MessageAction>;
      add: (key: string, value: any) => void;
      read: (key: string) => any;
    }
  | undefined
>(undefined);

const CacheReducer = (state: CacheState, action: MessageAction): CacheState => {
  switch (action.type) {
    case "ADD":
      return {
        ...state,
        [action.payload.key]: action.payload.value,
      };
    case "READ":
      return state[action.payload];
    default:
      return state;
  }
};

export const CacheProvider: React.FC<CacheState & { children: ReactNode }> = (
  props: CacheState & { children: ReactNode }
) => {
  const { children, ...restProps } = props;
  const [state, dispatch] = useReducer(CacheReducer, {
    ...restProps,
  });

  const add = (key: string, value: any) => {
    dispatch({ type: "ADD", payload: { key, value } });
  };

  const read = (key: string) => {
    dispatch({ type: "READ", payload: key });
  };

  return (
    <CacheContext.Provider value={{ state, dispatch, add, read }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = (): {
  state: CacheState;
  dispatch: React.Dispatch<MessageAction>;
  add: (key: string, value: any) => void;
  read: (key: string) => any;
} => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error("useCache must be used within a CacheProvider");
  }
  return context;
};
