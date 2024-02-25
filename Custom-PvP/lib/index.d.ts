import { Shot } from "@nxg-org/mineflayer-trajectories";
import { SwordPvp } from "./sword/swordPvp";
import { Bot } from "mineflayer";
import { Entity } from "prismarine-entity";
import { BowFullConfig, BowPVP } from "./bow/bowpvp";
import { SwordFullConfig } from "./sword/swordconfigs";
declare module "mineflayer" {
    interface Bot {
        swordpvp: SwordPvp;
        bowpvp: BowPVP;
    }
    interface BotEvents {
        attackedTarget: (target: Entity) => void;
        stoppedAttacking: () => void;
        startedAttacking: (target: Entity) => void;
        targetBlockingUpdate: (target: Entity, blocking: boolean) => void;
    }
}
export declare function getPlugin(swordConfig?: Partial<SwordFullConfig>, bowConfig?: Partial<BowFullConfig>): (bot: Bot) => void;
export declare function defaultPlugin(bot: Bot): void;
export { Shot };
