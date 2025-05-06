import { Injectable } from '@nestjs/common';

@Injectable()
export class TasksService {
  private tasks: any[] = [];

  async createTask(task: any) {
    const newTask = {
      id: Date.now().toString(),
      ...task,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.push(newTask);
    return newTask;
  }

  async findAll() {
    return this.tasks;
  }

  async findOne(id: string) {
    return this.tasks.find(task => task.id === id);
  }

  async update(id: string, task: any) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const updatedTask = {
      ...this.tasks[index],
      ...task,
      updatedAt: new Date(),
    };
    this.tasks[index] = updatedTask;
    return updatedTask;
  }

  async remove(id: string) {
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) return null;

    const [removedTask] = this.tasks.splice(index, 1);
    return removedTask;
  }
} 