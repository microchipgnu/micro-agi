import { ReactNode } from "react";
import { TaskProvider } from "../providers/task-provider";
import { Task as TaskType } from "../types";

const Task: React.FC<TaskType & { children?: ReactNode }> = (
  props: TaskType & { children?: ReactNode }
) => {
  const { children, ...restProps } = props;

  return <TaskProvider {...restProps}>{props.children}</TaskProvider>;
};

export default Task;
