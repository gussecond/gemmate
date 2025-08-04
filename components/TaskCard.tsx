
import React from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  return (
    <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div>
        <h5 className="font-semibold text-gray-800 dark:text-gray-100">{task.name}</h5>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
      </div>
    </div>
  );
};

export default TaskCard;