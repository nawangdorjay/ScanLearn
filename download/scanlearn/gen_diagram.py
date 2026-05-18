#!/usr/bin/env python3
"""
ScanLearn Architecture Diagram Generator
Generates a professional architecture overview diagram saved as PNG.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe
import numpy as np

# ── Configuration ──────────────────────────────────────────────────────────
DPI = 200
WIDTH_PX, HEIGHT_PX = 1400, 850
FIG_W, FIG_H = WIDTH_PX / DPI, HEIGHT_PX / DPI

# Color palette
COLORS = {
    'bg':             '#F0F4F8',
    'user_bg':        '#DBEAFE',
    'user_border':    '#3B82F6',
    'user_text':      '#1E3A5F',
    'api_bg':         '#E0F2FE',
    'api_border':     '#0284C7',
    'api_text':       '#0C4A6E',
    'ai_bg':          '#FFF7ED',
    'ai_border':      '#F59E0B',
    'ai_accent':      '#F97316',
    'ai_text':        '#7C2D12',
    'data_bg':        '#ECFDF5',
    'data_border':    '#10B981',
    'data_text':      '#064E3B',
    'gemma_bg':       '#FED7AA',
    'gemma_border':   '#EA580C',
    'gemma_text':     '#7C2D12',
    'arrow':          '#64748B',
    'title':          '#0F172A',
    'subtitle':       '#475569',
    'badge_bg':       '#FEF3C7',
    'badge_border':   '#D97706',
    'badge_text':     '#92400E',
}

OUTPUT_PATH = '/home/z/my-project/download/scanlearn/architecture_diagram.png'

# ── Helper drawing functions ───────────────────────────────────────────────

def draw_rounded_box(ax, x, y, w, h, facecolor, edgecolor, linewidth=2.0,
                     radius=0.15, zorder=2):
    """Draw a rounded rectangle."""
    box = FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0,rounding_size={radius}",
        facecolor=facecolor, edgecolor=edgecolor,
        linewidth=linewidth, zorder=zorder,
        mutation_scale=1
    )
    ax.add_patch(box)
    return box


def draw_component(ax, x, y, w, h, label, sublabel=None,
                   facecolor='#FFFFFF', edgecolor='#94A3B8',
                   textcolor='#1E293B', fontsize=9, sublabel_size=7.5,
                   linewidth=1.5, radius=0.08, zorder=3,
                   bold=False, icon=None):
    """Draw a component box with label and optional sublabel."""
    draw_rounded_box(ax, x, y, w, h, facecolor, edgecolor, linewidth, radius, zorder)
    weight = 'bold' if bold else 'normal'
    if icon:
        label = f"{icon}  {label}"
    if sublabel:
        ax.text(x + w/2, y + h*0.6, label,
                ha='center', va='center', fontsize=fontsize,
                color=textcolor, fontweight=weight, zorder=4,
                fontfamily='DejaVu Sans')
        ax.text(x + w/2, y + h*0.28, sublabel,
                ha='center', va='center', fontsize=sublabel_size,
                color=textcolor, alpha=0.7, zorder=4,
                fontfamily='DejaVu Sans')
    else:
        ax.text(x + w/2, y + h/2, label,
                ha='center', va='center', fontsize=fontsize,
                color=textcolor, fontweight=weight, zorder=4,
                fontfamily='DejaVu Sans')


def draw_layer_label(ax, x, y, label, color, fontsize=11):
    """Draw a layer group label above a column."""
    ax.text(x, y, label,
            ha='center', va='center', fontsize=fontsize,
            color=color, fontweight='bold', zorder=4,
            fontfamily='DejaVu Sans')


def draw_arrow(ax, x1, y1, x2, y2, color='#64748B', style='->',
               linewidth=1.8, connectionstyle='arc3,rad=0.0', zorder=2):
    """Draw a connection arrow."""
    arrow = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle=style,
        connectionstyle=connectionstyle,
        color=color,
        linewidth=linewidth,
        zorder=zorder,
        mutation_scale=15,
    )
    ax.add_patch(arrow)


def draw_arrow_double(ax, x1, y1, x2, y2, color='#64748B', linewidth=1.8, zorder=2):
    """Draw a double-headed arrow."""
    arrow = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle='<->',
        connectionstyle='arc3,rad=0.0',
        color=color,
        linewidth=linewidth,
        zorder=zorder,
        mutation_scale=15,
    )
    ax.add_patch(arrow)


def draw_badge(ax, x, y, label, bg_color, border_color, text_color):
    """Draw a small badge/label."""
    tw = len(label) * 0.0055 + 0.02
    th = 0.032
    draw_rounded_box(ax, x - tw/2, y - th/2, tw, th,
                     bg_color, border_color, linewidth=1.2, radius=0.01, zorder=5)
    ax.text(x, y, label,
            ha='center', va='center', fontsize=7,
            color=text_color, fontweight='bold', zorder=6,
            fontfamily='DejaVu Sans')


# ── Main diagram ───────────────────────────────────────────────────────────

def create_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(FIG_W, FIG_H))
    fig.patch.set_facecolor(COLORS['bg'])
    ax.set_facecolor(COLORS['bg'])
    ax.set_xlim(0, FIG_W)
    ax.set_ylim(0, FIG_H)
    ax.axis('off')

    # ── Title ──────────────────────────────────────────────────────────────
    ax.text(FIG_W/2, FIG_H - 0.35, 'ScanLearn — Architecture Overview',
            ha='center', va='center', fontsize=20, color=COLORS['title'],
            fontweight='bold', fontfamily='DejaVu Sans', zorder=10)
    ax.text(FIG_W/2, FIG_H - 0.55, 'Powered by Gemma 4 Multimodal + Function Calling',
            ha='center', va='center', fontsize=12, color=COLORS['subtitle'],
            fontfamily='DejaVu Sans', zorder=10)

    # ── Layer positions (x centers, y ranges) ─────────────────────────────
    # Column widths and positions
    col_w = 2.3          # width of each component box
    col_gap = 0.25       # gap between component boxes
    group_gap = 0.65     # gap between layer groups

    # Y range for the component area
    y_top = FIG_H - 1.05
    y_bot = 1.2
    total_h = y_top - y_bot

    # Layer group X positions (left edge of group background)
    layer_bg_w = col_w + 0.35
    g1_x = 0.25          # User layer
    g2_x = g1_x + layer_bg_w + group_gap   # API layer
    g3_x = g2_x + layer_bg_w + group_gap + 0.55  # AI layer (wider)
    g4_x = g3_x + layer_bg_w + 0.55 + group_gap  # Data layer

    # AI layer is wider to be prominent
    ai_bg_w = layer_bg_w + 0.55

    # Component box positions within each group
    comp_w = col_w - 0.05
    comp_h = 0.52

    # ── Layer background boxes ─────────────────────────────────────────────

    # User Layer background
    user_bg_h = total_h + 0.15
    draw_rounded_box(ax, g1_x - 0.05, y_bot - 0.08, layer_bg_w, user_bg_h,
                     COLORS['user_bg'], COLORS['user_border'], linewidth=2.5,
                     radius=0.08, zorder=1)

    # API Layer background
    draw_rounded_box(ax, g2_x - 0.05, y_bot - 0.08, layer_bg_w, user_bg_h,
                     COLORS['api_bg'], COLORS['api_border'], linewidth=2.5,
                     radius=0.08, zorder=1)

    # AI Processing Layer background (highlighted)
    draw_rounded_box(ax, g3_x - 0.05, y_bot - 0.08, ai_bg_w, user_bg_h,
                     COLORS['ai_bg'], COLORS['ai_border'], linewidth=3.0,
                     radius=0.08, zorder=1)
    # Inner glow effect for AI layer
    draw_rounded_box(ax, g3_x, y_bot + 0.02, ai_bg_w - 0.1, user_bg_h - 0.2,
                     '#FFFBF5', '#FBBF24', linewidth=1.0,
                     radius=0.06, zorder=1)

    # Data Layer background
    draw_rounded_box(ax, g4_x - 0.05, y_bot - 0.08, layer_bg_w, user_bg_h,
                     COLORS['data_bg'], COLORS['data_border'], linewidth=2.5,
                     radius=0.08, zorder=1)

    # ── Layer Labels ───────────────────────────────────────────────────────
    label_y = y_top + 0.18
    draw_layer_label(ax, g1_x + layer_bg_w/2 - 0.05, label_y,
                     'USER  LAYER', COLORS['user_text'], fontsize=11)
    draw_layer_label(ax, g2_x + layer_bg_w/2 - 0.05, label_y,
                     'API  LAYER', COLORS['api_text'], fontsize=11)
    draw_layer_label(ax, g3_x + ai_bg_w/2 - 0.05, label_y,
                     'AI  PROCESSING  LAYER', COLORS['ai_text'], fontsize=11.5)
    draw_layer_label(ax, g4_x + layer_bg_w/2 - 0.05, label_y,
                     'DATA  LAYER', COLORS['data_text'], fontsize=11)

    # ── User Layer Components ──────────────────────────────────────────────
    uc_x = g1_x + 0.17
    n_user = 4
    spacing = (user_bg_h - 0.2) / n_user

    draw_component(ax, uc_x, y_top - spacing*0.3, comp_w, comp_h,
                   '[Camera]  Upload Textbook Image', 'Camera / Photo Upload',
                   facecolor='#FFFFFF', edgecolor=COLORS['user_border'],
                   textcolor=COLORS['user_text'], fontsize=9, sublabel_size=7.5)

    draw_component(ax, uc_x, y_top - spacing*1.3, comp_w, comp_h,
                   'Select Difficulty Level',
                   'Beginner · Intermediate · Advanced',
                   facecolor='#FFFFFF', edgecolor=COLORS['user_border'],
                   textcolor=COLORS['user_text'], fontsize=9, sublabel_size=7.5)

    draw_component(ax, uc_x, y_top - spacing*2.3, comp_w, comp_h,
                   'Choose Language',
                   'EN · ES · HI · FR',
                   facecolor='#FFFFFF', edgecolor=COLORS['user_border'],
                   textcolor=COLORS['user_text'], fontsize=9, sublabel_size=7.5)

    draw_component(ax, uc_x, y_top - spacing*3.3, comp_w, comp_h,
                   'Take Interactive Quiz',
                   'MCQ · Fill-in-Blank · True/False',
                   facecolor='#FFFFFF', edgecolor=COLORS['user_border'],
                   textcolor=COLORS['user_text'], fontsize=9, sublabel_size=7.5)

    # ── API Layer Components ───────────────────────────────────────────────
    ac_x = g2_x + 0.17

    draw_component(ax, ac_x, y_top - spacing*0.3, comp_w, comp_h,
                   'REST API Gateway',
                   'Authentication & Routing',
                   facecolor='#FFFFFF', edgecolor=COLORS['api_border'],
                   textcolor=COLORS['api_text'], fontsize=9, sublabel_size=7.5,
                   bold=True)

    draw_component(ax, ac_x, y_top - spacing*1.3, comp_w, comp_h,
                   'Session Manager',
                   'Stateful Quiz Sessions',
                   facecolor='#FFFFFF', edgecolor=COLORS['api_border'],
                   textcolor=COLORS['api_text'], fontsize=9, sublabel_size=7.5)

    draw_component(ax, ac_x, y_top - spacing*2.3, comp_w, comp_h,
                   'Progress Tracker',
                   'Scoring & Analytics',
                   facecolor='#FFFFFF', edgecolor=COLORS['api_border'],
                   textcolor=COLORS['api_text'], fontsize=9, sublabel_size=7.5)

    # ── AI Processing Layer Components ────────────────────────────────────
    ai_cx = g3_x + 0.17
    ai_cw = comp_w + 0.2  # slightly wider components

    # Gemma 4 Multimodal (prominent)
    draw_component(ax, ai_cx, y_top - spacing*0.2, ai_cw, comp_h + 0.08,
                   'Gemma 4 Multimodal',
                   'Image Understanding & Text Extraction',
                   facecolor=COLORS['gemma_bg'], edgecolor=COLORS['gemma_border'],
                   textcolor=COLORS['gemma_text'], fontsize=9.5, sublabel_size=7.5,
                   bold=True, linewidth=2.0)

    # Gemma 4 Function Calling
    draw_component(ax, ai_cx, y_top - spacing*1.3, ai_cw, comp_h + 0.08,
                   'Gemma 4 Function Calling',
                   'MCQ · Fill-in-Blank · T/F · Short Answer',
                   facecolor=COLORS['gemma_bg'], edgecolor=COLORS['gemma_border'],
                   textcolor=COLORS['gemma_text'], fontsize=9.5, sublabel_size=7.5,
                   bold=True, linewidth=2.0)

    # Adaptive Engine
    draw_component(ax, ai_cx, y_top - spacing*2.4, ai_cw, comp_h,
                   'Adaptive Engine',
                   'Dynamic Difficulty Adjustment',
                   facecolor='#FFFFFF', edgecolor=COLORS['ai_border'],
                   textcolor=COLORS['ai_text'], fontsize=9, sublabel_size=7.5,
                   linewidth=1.5)

    # RAG Knowledge Base
    draw_component(ax, ai_cx, y_top - spacing*3.4, ai_cw, comp_h,
                   'RAG Knowledge Base',
                   'Educational Context Retrieval',
                   facecolor='#FFFFFF', edgecolor=COLORS['ai_border'],
                   textcolor=COLORS['ai_text'], fontsize=9, sublabel_size=7.5,
                   linewidth=1.5)

    # Internal connections within AI layer (vertical)
    ai_center_x = ai_cx + ai_cw / 2
    # Gemma Multimodal <-> Gemma FC
    draw_arrow(ax, ai_center_x - 0.3, y_top - spacing*0.2 - 0.05,
               ai_center_x - 0.3, y_top - spacing*1.3 + comp_h + 0.08 + 0.02,
               color=COLORS['gemma_border'], linewidth=2.0, zorder=4)
    draw_arrow(ax, ai_center_x + 0.3, y_top - spacing*1.3 + comp_h + 0.08 + 0.02,
               ai_center_x + 0.3, y_top - spacing*0.2 - 0.05,
               color=COLORS['gemma_border'], linewidth=2.0, zorder=4)

    # Gemma FC <-> Adaptive Engine
    draw_arrow_double(ax, ai_center_x, y_top - spacing*1.3 - 0.02,
                      ai_center_x, y_top - spacing*2.4 + comp_h + 0.02,
                      color=COLORS['ai_border'], linewidth=1.5, zorder=4)

    # Adaptive Engine <-> RAG
    draw_arrow_double(ax, ai_center_x, y_top - spacing*2.4 - 0.02,
                      ai_center_x, y_top - spacing*3.4 + comp_h + 0.02,
                      color=COLORS['ai_border'], linewidth=1.5, zorder=4)

    # ── Data Layer Components ──────────────────────────────────────────────
    dc_x = g4_x + 0.17

    draw_component(ax, dc_x, y_top - spacing*0.5, comp_w, comp_h,
                   'Quiz Bank',
                   'PostgreSQL',
                   facecolor='#FFFFFF', edgecolor=COLORS['data_border'],
                   textcolor=COLORS['data_text'], fontsize=9, sublabel_size=7.5,
                   bold=True)

    draw_component(ax, dc_x, y_top - spacing*1.8, comp_w, comp_h,
                   'User Progress',
                   'PostgreSQL',
                   facecolor='#FFFFFF', edgecolor=COLORS['data_border'],
                   textcolor=COLORS['data_text'], fontsize=9, sublabel_size=7.5)

    draw_component(ax, dc_x, y_top - spacing*3.1, comp_w, comp_h,
                   'Content Cache',
                   'Redis',
                   facecolor='#FFFFFF', edgecolor=COLORS['data_border'],
                   textcolor=COLORS['data_text'], fontsize=9, sublabel_size=7.5)

    # ── Inter-layer arrows ─────────────────────────────────────────────────
    arrow_y_levels = [y_top - spacing*0.1, y_top - spacing*1.6, y_top - spacing*2.8]

    # User → API arrows
    for ay in arrow_y_levels:
        draw_arrow(ax, uc_x + comp_w, ay, ac_x, ay,
                   color=COLORS['arrow'], linewidth=2.0, zorder=5)

    # HTTPS label
    mid_x_ua = (uc_x + comp_w + ac_x) / 2
    ax.text(mid_x_ua, arrow_y_levels[0] + 0.15, 'HTTPS',
            ha='center', va='center', fontsize=7.5, color=COLORS['arrow'],
            fontweight='bold', fontfamily='DejaVu Sans',
            bbox=dict(boxstyle='round,pad=0.15', facecolor='white',
                      edgecolor=COLORS['arrow'], linewidth=1.0),
            zorder=6)

    # API → AI arrows
    for ay in arrow_y_levels:
        draw_arrow(ax, ac_x + comp_w, ay, ai_cx, ay,
                   color=COLORS['arrow'], linewidth=2.0, zorder=5)

    # Internal calls label
    mid_x_ai = (ac_x + comp_w + ai_cx) / 2
    ax.text(mid_x_ai, arrow_y_levels[0] + 0.15, 'Internal Calls',
            ha='center', va='center', fontsize=7.5, color=COLORS['arrow'],
            fontweight='bold', fontfamily='DejaVu Sans',
            bbox=dict(boxstyle='round,pad=0.15', facecolor='white',
                      edgecolor=COLORS['arrow'], linewidth=1.0),
            zorder=6)

    # AI ↔ Data arrows
    ai_right = ai_cx + ai_cw
    data_arrow_ys = [y_top - spacing*0.5 + comp_h/2,
                     y_top - spacing*1.8 + comp_h/2,
                     y_top - spacing*3.1 + comp_h/2]
    for ay in data_arrow_ys:
        draw_arrow_double(ax, ai_right, ay, dc_x, ay,
                          color=COLORS['arrow'], linewidth=2.0, zorder=5)

    # Read/Write label
    mid_x_da = (ai_right + dc_x) / 2
    ax.text(mid_x_da, data_arrow_ys[0] + 0.15, 'Read / Write',
            ha='center', va='center', fontsize=7.5, color=COLORS['arrow'],
            fontweight='bold', fontfamily='DejaVu Sans',
            bbox=dict(boxstyle='round,pad=0.15', facecolor='white',
                      edgecolor=COLORS['arrow'], linewidth=1.0),
            zorder=6)

    # ── Badge: Local Deployment Supported ──────────────────────────────────
    badge_x = g3_x + ai_bg_w / 2 - 0.05
    badge_y = y_bot + 0.05
    draw_badge(ax, badge_x, badge_y, '[LOCAL]  Local Deployment Supported',
               COLORS['badge_bg'], COLORS['badge_border'], COLORS['badge_text'])

    # ── Footer ─────────────────────────────────────────────────────────────
    ax.text(FIG_W / 2, 0.2,
            'ScanLearn  •  AI-Powered Adaptive Quiz Generator  •  Open Source',
            ha='center', va='center', fontsize=8, color='#94A3B8',
            fontfamily='DejaVu Sans', zorder=10)

    plt.tight_layout(pad=0.2)
    fig.savefig(OUTPUT_PATH, dpi=DPI, bbox_inches='tight',
                facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    print(f"✅  Diagram saved to {OUTPUT_PATH}")


if __name__ == '__main__':
    create_diagram()
