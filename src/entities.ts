import { LunarFarm as LunarFarmContract } from "../generated/LunarFarm/LunarFarm";
import { LunarFarm, Pool, User } from "../generated/schema";
import { BigInt, Address, dataSource, ethereum } from "@graphprotocol/graph-ts";

const ZERO = BigInt.fromI32(0);
const ONE = BigInt.fromI32(1);
const ZERO_ADDR = Address.fromString("0x0000000000000000000000000000000000000000");

export function getLunarFarm(block: ethereum.Block): LunarFarm {
  let lunarFarm = LunarFarm.load(dataSource.address().toHex());

  if (lunarFarm === null) {
    const LUNAR_FARM_ADDRESS = dataSource.address();
    const lunarFarmContract = LunarFarmContract.bind(LUNAR_FARM_ADDRESS);

    lunarFarm = new LunarFarm(LUNAR_FARM_ADDRESS.toHex());
    lunarFarm.lunar = lunarFarmContract.lunar();
    lunarFarm.poolCount = ZERO;
  }

  lunarFarm.timestamp = block.timestamp;
  lunarFarm.block = block.number;
  lunarFarm.save();

  return lunarFarm as LunarFarm;
}

export function getPool(pid: BigInt, block: ethereum.Block): Pool {
  const lunarFarm = getLunarFarm(block);

  let pool = Pool.load(pid.toString());

  if (pool === null) {
    pool = new Pool(pid.toString());
    pool.lunarFarm = lunarFarm.id;
    pool.pair = ZERO_ADDR;
    pool.lastRewardTime = ZERO;
    pool.accLunarPerShare = ZERO;
    pool.depositAmount = ZERO;
    pool.lunarAmount = ZERO;
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
  const id = pid
    .toString()
    .concat("-")
    .concat(uid);
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
