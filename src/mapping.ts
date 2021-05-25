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
  const { params, block } = event;

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
  log.info("[LunarFarm] Deposit {} {} {} {}", [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex(),
  ]);

  getLunarFarm(event.block);
  const pool = getPool(event.params.pid, event.block);
  const user = getUser(event.params.to, event.params.pid, event.block);

  pool.depositAmount = pool.depositAmount.plus(event.params.amount);
  pool.save();

  user.amount = user.amount.plus(event.params.amount);
  user.rewardDebt = user.rewardDebt.plus(event.params.amount.times(pool.accLunarPerShare).div(ACC_PRECISION));
  user.save();
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  log.info("[LunarFarm] Log Emergency Withdraw {} {} {} {}", [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex(),
  ]);

  getLunarFarm(event.block);
  const user = getUser(event.params.user, event.params.pid, event.block);

  user.amount = ZERO;
  user.rewardDebt = ZERO;
  user.save();
}

export function handleHarvest(event: Harvest): void {
  log.info("[MiniChef] Log Withdraw {} {} {}", [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
  ]);

  getLunarFarm(event.block);
  const pool = getPool(event.params.pid, event.block);
  const user = getUser(event.params.user, event.params.pid, event.block);

  let accumulatedLunar = user.amount.times(pool.accLunarPerShare).div(ACC_PRECISION);

  user.rewardDebt = accumulatedLunar;
  user.lunarHarvested = user.lunarHarvested.plus(event.params.amount);
  user.save();
}

export function handleIncreasePoolEndTime(event: IncreasePoolEndTime): void {
  const { params, block } = event;

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
  log.info("[LunarFarm] Log Update Pool {} {} {} {}", [
    event.params.pid.toString(),
    event.params.lastRewardTime.toString(), //uint64, I think this is Decimal but not sure
    event.params.accLunarPerShare.toString(),
  ]);

  getLunarFarm(event.block);
  const pool = getPool(event.params.pid, event.block);

  pool.accLunarPerShare = event.params.accLunarPerShare;
  pool.lastRewardTime = event.params.lastRewardTime;
  pool.save();
}

export function handleWithdraw(event: Withdraw): void {
  log.info("[LunarFarm] Log Withdraw {} {} {} {}", [
    event.params.user.toHex(),
    event.params.pid.toString(),
    event.params.amount.toString(),
    event.params.to.toHex(),
  ]);

  getLunarFarm(event.block);
  const pool = getPool(event.params.pid, event.block);
  const user = getUser(event.params.user, event.params.pid, event.block);

  pool.depositAmount = pool.depositAmount.minus(event.params.amount);
  pool.save();

  user.amount = user.amount.minus(event.params.amount);
  user.rewardDebt = user.rewardDebt.minus(event.params.amount.times(pool.accLunarPerShare).div(ACC_PRECISION));
  user.save();
}

export function handleWithdrawRemainingReward(event: WithdrawRemainingReward): void {}
