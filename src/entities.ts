import { LunarFarm as LunarFarmContract } from "../generated/LunarFarm/LunarFarm";
import { LunarFarm, Pool, User } from "../generated/schema";
import { BigInt, Address, dataSource, ethereum } from "@graphprotocol/graph-ts";

const LUNAR_FARM_ADDRESS = dataSource.address();
export const ACC_PRECISION = BigInt.fromString("1000000000000");
export const ZERO = BigInt.fromI32(0);
export const ONE = BigInt.fromI32(1);
export const ZERO_ADDR = Address.fromString("0x0000000000000000000000000000000000000000");

export function getLunarFarmContract(): LunarFarmContract {
  return LunarFarmContract.bind(LUNAR_FARM_ADDRESS);
}

export function getLunarFarm(block: ethereum.Block): LunarFarm {
  let lunarFarm = LunarFarm.load(LUNAR_FARM_ADDRESS.toHex());

  if (lunarFarm === null) {
    const lunarFarmContract = getLunarFarmContract();

    lunarFarm = new LunarFarm(LUNAR_FARM_ADDRESS.toHex());
    lunarFarm.lunar = lunarFarmContract.lunar();
    lunarFarm.poolCount = ZERO;
  }

  lunarFarm.timestamp = block.timestamp;
  lunarFarm.block = block.number;
  lunarFarm.save();

  return lunarFarm as LunarFarm;
}

export class LunarFarmEntity extends LunarFarm {
  static loadOrCreate(): LunarFarmEntity {
    let lunarFarm = LunarFarmEntity.load(LUNAR_FARM_ADDRESS.toHex());

    if (lunarFarm === null) {
      const lunarFarmContract = getLunarFarmContract();

      lunarFarm = new LunarFarmEntity(LUNAR_FARM_ADDRESS.toHex());
      lunarFarm.lunar = lunarFarmContract.lunar();
      lunarFarm.poolCount = ZERO;
    }

    return lunarFarm as LunarFarmEntity;
  }

  updateAndSave(block: ethereum.Block): void {
    this.timestamp = block.timestamp;
    this.block = block.number;
    this.save();
  }
}

export function getPool(pid: BigInt, block: ethereum.Block): Pool {
  const lunarFarm = getLunarFarm(block);

  let pool = Pool.load(pid.toString());

  if (pool === null) {
    pool = new Pool(pid.toString());
    pool.lunarFarm = lunarFarm.id;
    pool.dToken = ZERO_ADDR;
    pool.lunarPerSecond = ZERO;
    pool.startTime = ZERO;
    pool.endTime = ZERO;
    pool.lunarAmount = ZERO;
    pool.lastRewardTime = ZERO;
    pool.accLunarPerShare = ZERO;
    pool.depositAmount = ZERO;
    pool.userCount = ZERO;
  }

  pool.timestamp = block.timestamp;
  pool.block = block.number;
  pool.save();

  return pool as Pool;
}

export function getUser(address: Address, pid: BigInt, block: ethereum.Block): User {
  const pool = getPool(pid, block);

  const uid = address.toHex();
  const id = pid.toString().concat("-").concat(uid);
  let user = User.load(id);

  if (user === null) {
    user = new User(id);
    user.address = address;
    user.pool = pool.id;
    user.amount = ZERO;
    user.rewardDebt = ZERO;
    user.lunarHarvested = ZERO;

    pool.userCount = pool.userCount.plus(ONE);
    pool.save();
  }

  user.timestamp = block.timestamp;
  user.block = block.number;
  user.save();

  return user as User;
}
