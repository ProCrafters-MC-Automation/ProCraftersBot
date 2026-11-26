import { Entity } from "prismarine-entity";
import { goals } from "mineflayer-pathfinder";
import { Bot } from "mineflayer";
import { FollowConfig, FullConfig } from "./swordconfigs";
export declare function generateGoal(bot: Bot, entity: Entity, options: FullConfig): goals.Goal | undefined;
export declare function goalEquals(bot: Bot, currentGoal: any, goal: any, options: FullConfig): boolean;
export declare function followEntity(bot: Bot, goal: any, options: FullConfig): any;
export declare function stopFollow(bot: Bot, mode: FollowConfig["mode"]): void;
