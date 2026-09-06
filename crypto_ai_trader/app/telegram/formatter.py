"""
Telegram Message Formatter.
Converts trading events, alerts, and state reports into polished, scannable HTML messages.
"""

from typing import Any, Dict, List
from crypto_ai_trader.app.telegram.types import (
    TradeAlertPayload, TPHitAlertPayload, SLHitAlertPayload
)


class TelegramMessageFormatter:
    """Provides consistent and beautiful HTML formatting for Telegram messages."""

    @staticmethod
    def format_status(
        bot_state: str,
        execution_mode: str,
        uptime_str: str,
        open_positions_count: int,
        pending_orders_count: int,
        current_regime: str,
        latency_ms: int = 24
    ) -> str:
        state_emoji = "🟢" if bot_state == "RUNNING" else "🟡" if bot_state == "PAUSED" else "🔴"
        mode_badge = f"<b>[{execution_mode.upper()} MODE]</b>"

        return (
            f"🤖 <b>CRYPTO AI TRADER STATUS</b> {mode_badge}\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• <b>Status:</b> {state_emoji} <code>{bot_state}</code>\n"
            f"• <b>Market Regime:</b> <code>{current_regime}</code>\n"
            f"• <b>Active Positions:</b> <code>{open_positions_count}</code>\n"
            f"• <b>Pending Orders:</b> <code>{pending_orders_count}</code>\n"
            f"• <b>System Uptime:</b> <code>{uptime_str}</code>\n"
            f"• <b>WS Latency:</b> <code>{latency_ms} ms</code>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"<i>Use buttons below or type /help for commands.</i>"
        )

    @staticmethod
    def format_balance(
        total_equity: float,
        available_cash: float,
        peak_equity: float,
        daily_pnl: float,
        daily_pnl_pct: float,
        current_drawdown_pct: float
    ) -> str:
        pnl_emoji = "🟢 +" if daily_pnl >= 0 else "🔴 "
        pnl_sign = "+" if daily_pnl >= 0 else ""

        return (
            f"💰 <b>PORTFOLIO BALANCE OVERVIEW</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• <b>Total Equity:</b> <code>${total_equity:,.2f} USDT</code>\n"
            f"• <b>Available Cash:</b> <code>${available_cash:,.2f} USDT</code>\n"
            f"• <b>Peak Equity:</b> <code>${peak_equity:,.2f} USDT</code>\n"
            f"• <b>Today's PnL:</b> {pnl_emoji}<code>${daily_pnl:,.2f} ({pnl_sign}{daily_pnl_pct:.2f}%)</code>\n"
            f"• <b>Current Drawdown:</b> <code>{current_drawdown_pct:.2f}%</code>\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )

    @staticmethod
    def format_positions(positions: List[Dict[str, Any]]) -> str:
        if not positions:
            return (
                f"📊 <b>ACTIVE POSITIONS (0)</b>\n"
                f"━━━━━━━━━━━━━━━━━━━━\n"
                f"<i>No open positions. System is monitoring for new signals.</i>"
            )

        lines = [f"📊 <b>ACTIVE POSITIONS ({len(positions)})</b>\n━━━━━━━━━━━━━━━━━━━━"]
        for p in positions:
            side = p.get("side", "LONG")
            side_badge = "🟢 LONG" if side == "LONG" else "🔴 SHORT"
            un_pnl = p.get("unrealized_pnl", 0.0)
            pnl_sign = "+" if un_pnl >= 0 else ""
            pnl_color = "🟢" if un_pnl >= 0 else "🔴"

            lines.append(
                f"• <b>{p.get('symbol')}</b> {side_badge} ({p.get('leverage', 1)}x)\n"
                f"  Entry: <code>${p.get('entry_price', 0):,.2f}</code> | Mark: <code>${p.get('mark_price', 0):,.2f}</code>\n"
                f"  PnL: {pnl_color} <code>{pnl_sign}${un_pnl:,.2f} ({pnl_sign}{p.get('unrealized_pnl_pct', 0):.2f}%)</code>\n"
                f"  SL: <code>${p.get('stop_loss', 0):,.2f}</code> | TP1: <code>${p.get('tp1', 0):,.2f}</code>\n"
            )
        lines.append("━━━━━━━━━━━━━━━━━━━━")
        return "\n".join(lines)

    @staticmethod
    def format_pnl(
        daily_pnl: float,
        weekly_pnl: float,
        monthly_pnl: float,
        win_rate: float,
        profit_factor: float,
        total_trades: int
    ) -> str:
        return (
            f"📈 <b>PERFORMANCE & PNL METRICS</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• <b>Daily PnL:</b> <code>{'+' if daily_pnl >= 0 else ''}${daily_pnl:,.2f}</code>\n"
            f"• <b>Weekly PnL:</b> <code>{'+' if weekly_pnl >= 0 else ''}${weekly_pnl:,.2f}</code>\n"
            f"• <b>Monthly PnL:</b> <code>{'+' if monthly_pnl >= 0 else ''}${monthly_pnl:,.2f}</code>\n"
            f"• <b>Win Rate:</b> <code>{win_rate:.1f}%</code> ({total_trades} trades)\n"
            f"• <b>Profit Factor:</b> <code>{profit_factor:.2f}</code>\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )

    @staticmethod
    def format_regime(regime_name: str, confidence: float, active_strategies: List[str]) -> str:
        strategies_str = ", ".join(f"<code>{s}</code>" for s in active_strategies)
        return (
            f"🧠 <b>AI REGIME DETECTION ENGINE</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• <b>Classified Regime:</b> <code>{regime_name}</code>\n"
            f"• <b>Confidence Level:</b> <code>{confidence * 100:.1f}%</code>\n"
            f"• <b>Active Strategies:</b> {strategies_str}\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )

    @staticmethod
    def format_trade_opened_alert(payload: TradeAlertPayload) -> str:
        side_emoji = "🟢 LONG" if payload.side == "LONG" else "🔴 SHORT"
        return (
            f"🚀 <b>NEW TRADE OPENED</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• <b>Pair:</b> <b>{payload.symbol}</b> ({side_emoji} {payload.leverage}x)\n"
            f"• <b>Entry Price:</b> <code>${payload.entry_price:,.2f}</code>\n"
            f"• <b>Position Size:</b> <code>{payload.size}</code>\n"
            f"• <b>Stop Loss:</b> <code>${payload.stop_loss:,.2f}</code>\n"
            f"• <b>TP1 (33%):</b> <code>${payload.tp1:,.2f}</code>\n"
            f"• <b>TP2 (33%):</b> <code>${payload.tp2:,.2f}</code>\n"
            f"• <b>TP3 (34%):</b> <code>${payload.tp3:,.2f}</code>\n"
            f"• <b>Strategy:</b> <code>{payload.strategy_name}</code>\n"
            f"• <b>AI Confidence:</b> <code>{payload.ai_confidence * 100:.1f}%</code>\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )

    @staticmethod
    def format_tp_hit_alert(payload: TPHitAlertPayload) -> str:
        return (
            f"🎯 <b>TAKE PROFIT {payload.tp_level} HIT!</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• <b>Pair:</b> <b>{payload.symbol}</b>\n"
            f"• <b>Trigger Price:</b> <code>${payload.price:,.2f}</code>\n"
            f"• <b>Locked Profit:</b> 🟢 <code>+${payload.realized_pnl:,.2f} USDT</code>\n"
            f"• <b>Portion Closed:</b> <code>{payload.percentage_closed:.0f}%</code>\n"
            f"• <i>Trailing stop updated to protect remaining capital.</i>\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )

    @staticmethod
    def format_sl_hit_alert(payload: SLHitAlertPayload) -> str:
        return (
            f"🛑 <b>STOP LOSS TRIGGERED</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• <b>Pair:</b> <b>{payload.symbol}</b>\n"
            f"• <b>Exit Price:</b> <code>${payload.exit_price:,.2f}</code>\n"
            f"• <b>Realized Loss:</b> 🔴 <code>-${abs(payload.realized_loss):,.2f} USDT</code>\n"
            f"• <b>Drawdown Impact:</b> <code>{payload.drawdown_pct:.2f}%</code>\n"
            f"• <i>Position fully closed per strict capital risk guidelines.</i>\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )

    @staticmethod
    def format_circuit_breaker_alert(reason: str) -> str:
        return (
            f"🚨 <b>CIRCUIT BREAKER TRIPPED!</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"<b>CRITICAL RISK ALERT:</b> Trading has been automatically frozen.\n"
            f"• <b>Trigger Reason:</b> <code>{reason}</code>\n"
            f"• <b>Action:</b> All open orders canceled. Re-entry disabled.\n"
            f"• <i>Use /resume &lt;token&gt; to manually unfreeze after review.</i>\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )

    @staticmethod
    def format_daily_summary(
        date_str: str,
        starting_equity: float,
        ending_equity: float,
        net_pnl: float,
        pnl_pct: float,
        trades_count: int,
        win_rate: float
    ) -> str:
        emoji = "🎉" if net_pnl >= 0 else "⚠️"
        sign = "+" if net_pnl >= 0 else ""
        return (
            f"{emoji} <b>DAILY PERFORMANCE SUMMARY ({date_str})</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"• <b>Starting Equity:</b> <code>${starting_equity:,.2f}</code>\n"
            f"• <b>Ending Equity:</b> <code>${ending_equity:,.2f}</code>\n"
            f"• <b>Net PnL:</b> <code>{sign}${net_pnl:,.2f} ({sign}{pnl_pct:.2f}%)</code>\n"
            f"• <b>Total Trades:</b> <code>{trades_count}</code>\n"
            f"• <b>Win Rate:</b> <code>{win_rate:.1f}%</code>\n"
            f"━━━━━━━━━━━━━━━━━━━━"
        )
