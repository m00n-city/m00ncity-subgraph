import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  LunarFarm as LunarFarmContract,
  AddPool,
  Deposit,
  EmergencyWithdraw,
  Harvest,
  IncreasePoolEndTime,
  OwnershipTransferred,
  UpdatePool,
  Withdraw,
  WithdrawRemainingReward,
} from "../generated/LunarFarm/LunarFarm";
import { getLunarFarmContract, getLunarFarm, getPool, getUser, ZERO, ONE, ACC_PRECISION } from "./entities";

export function handleAddPool(event: AddPool): void {
  const params = event.params;
  const block = event.block;

  log.info("[LunarFarm] AddPool({} {} {} {} {} {})", [
    params.pid.toString(),
    params.dToken.toHex(),
    params.lunarPerSecond.toString(),
    params.startTime.toString(),
    params.endTime.toString(),
    params.rewardAmount.toString(),
  ]);

  const lunarFarm = getLunarFarm(event.block);
  const pool = getPool(params.pid, block);
  pool.dToken = params.dToken;
  pool.lunarPerSecond = params.lunarPerSecond;
  pool.startTime = params.startTime;
  pool.endTime = params.endTime;
  pool.lunarAmount = params.rewardAmount;
  pool.timestamp = block.timestamp;
  pool.block = block.number;

  pool.save();

  lunarFarm.poolCount = lunarFarm.poolCount.plus(ONE);
  lunarFarm.save();
}

export function handleDeposit(event: Deposit): void {
  const params = event.params;
  const block = event.block;

  log.info("[LunarFarm] Deposit {} {} {} {}", [
    params.user.toHex(),
    params.pid.toString(),
    params.amount.toString(),
    params.to.toHex(),
  ]);

  getLunarFarm(block);
  const pool = getPool(params.pid, block);
  const user = getUser(params.to, params.pid, block);

  pool.depositAmount = pool.depositAmount.plus(params.amount);
  pool.save();

  user.amount = user.amount.plus(params.amount);
  user.rewardDebt = user.rewardDebt.plus(params.amount.times(pool.accLunarPerShare).div(ACC_PRECISION));
  user.save();
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  const params = event.params;
  const block = event.block;

  log.info("[LunarFarm] Log Emergency Withdraw {} {} {} {}", [
    params.user.toHex(),
    params.pid.toString(),
    params.amount.toString(),
    params.to.toHex(),
  ]);

  getLunarFarm(block);
  const user = getUser(params.user, params.pid, block);

  user.amount = ZERO;
  user.rewardDebt = ZERO;
  user.save();
}

export function handleHarvest(event: Harvest): void {
  const params = event.params;
  const block = event.block;

  log.info("[MiniChef] Log Withdraw {} {} {}", [params.user.toHex(), params.pid.toString(), params.amount.toString()]);

  getLunarFarm(block);
  const pool = getPool(params.pid, block);
  const user = getUser(params.user, params.pid, block);

  let accumulatedLunar = user.amount.times(pool.accLunarPerShare).div(ACC_PRECISION);

  user.rewardDebt = accumulatedLunar;
  user.lunarHarvested = user.lunarHarvested.plus(params.amount);
  user.save();
}

export function handleIncreasePoolEndTime(event: IncreasePoolEndTime): void {
  const params = event.params;
  const block = event.block;

  getLunarFarm(block);
  const pool = getPool(params.pid, block);
  const lunarFarmContract = getLunarFarmContract();
  const poolInfo = lunarFarmContract.poolInfo(params.pid);

  pool.endTime = pool.endTime.plus(params.secs);
  pool.lunarAmount = poolInfo.value7;
  pool.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleUpdatePool(event: UpdatePool): void {
  const params = event.params;
  const block = event.block;

  log.info("[LunarFarm] Log Update Pool {} {} {} {}", [
    params.pid.toString(),
    params.lastRewardTime.toString(), //uint64, I think this is Decimal but not sure
    params.accLunarPerShare.toString(),
  ]);

  getLunarFarm(block);
  const pool = getPool(params.pid, block);

  pool.accLunarPerShare = params.accLunarPerShare;
  pool.lastRewardTime = params.lastRewardTime;
  pool.save();
}

export function handleWithdraw(event: Withdraw): void {
  const params = event.params;
  const block = event.block;

  log.info("[LunarFarm] Log Withdraw {} {} {} {}", [
    params.user.toHex(),
    params.pid.toString(),
    params.amount.toString(),
    params.to.toHex(),
  ]);

  getLunarFarm(block);
  const pool = getPool(params.pid, block);
  const user = getUser(params.user, params.pid, block);

  pool.depositAmount = pool.depositAmount.minus(params.amount);
  pool.save();

  user.amount = user.amount.minus(params.amount);
  user.rewardDebt = user.rewardDebt.minus(params.amount.times(pool.accLunarPerShare).div(ACC_PRECISION));
  user.save();
}

export function handleWithdrawRemainingReward(event: WithdrawRemainingReward): void {}
