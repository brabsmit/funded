#!/usr/bin/env python3
"""Build data/FundED-data-template.xlsx from data/sheet/*.csv with header styling,
frozen header row, and dropdown validation on enum columns. Upload the xlsx to
Google Drive and open with Google Sheets; validation carries over."""
import csv
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "sheet"
OUT = ROOT / "data" / "FundED-data-template.xlsx"
TABS = ["Tracks", "Stages", "Schools", "Needs", "Milestones", "Engage", "Inquiries", "Sources", "Legend"]
ENUMS = {
    "basis": "fact,requirement,estimate,interpretation",
    "stage_basis": "fact,requirement,estimate,interpretation",
    "cost_basis": "fact,requirement,estimate,interpretation",
    "window_basis": "fact,requirement,estimate,interpretation",
    "verification": "draft,documented,confirmed",
}
STATUS = {"Schools": "live,draft", "Milestones": "done,next,later", "Inquiries": "answered,partial,unanswered"}
FONT = "Arial"

wb = Workbook()
wb.remove(wb.active)
for tab in TABS:
    ws = wb.create_sheet(tab)
    with open(SRC / f"{tab}.csv", newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    for r in rows:
        ws.append(r)
    header = rows[0]
    for c in ws[1]:
        c.font = Font(name=FONT, bold=True)
        c.fill = PatternFill("solid", fgColor="E3EEF7")
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.font = Font(name=FONT)
    ws.freeze_panes = "A2"
    for i, name in enumerate(header, start=1):
        col = ws.cell(row=1, column=i).column_letter
        ws.column_dimensions[col].width = max(14, min(60, max(len(str(r[i-1])) if i-1 < len(r) else 0 for r in rows) + 2))
        values = ENUMS.get(name) or (STATUS.get(tab) if name == "status" else None)
        if values and tab != "Legend":
            dv = DataValidation(type="list", formula1=f'"{values}"', allow_blank=True, showErrorMessage=True,
                                errorTitle="Not an allowed value", error=f"Use one of: {values.replace(',', ', ')}")
            ws.add_data_validation(dv)
            dv.add(f"{col}2:{col}500")
wb.save(OUT)
print(f"wrote {OUT.relative_to(ROOT)} with tabs: {', '.join(TABS)}")
