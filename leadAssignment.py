import sys
import json

def lead_assignment(industry, assets, sales_volume=None):
    team = None
    industry = industry.lower()
    assets = int(assets)
    if industry in ['bank', 'credit union']:
        team = "Financial Services" if assets >= 15000 else "Regional"
    elif industry == 'motor vehicle':
        team = "Specialty" if sales_volume and sales_volume >= 250000000 else "Regional"
    elif industry == 'insurance':
        team = "Specialty"
    elif industry in ["investment", "brokerage"]:
        team = 'Specialty'
    elif industry == 'law firm':
        team = 'Regional'
    else:
        team = 'Specialty' if sales_volume and sales_volume >= 250000000 else 'Regional'
    return team

if __name__ == "__main__":
    industry = sys.argv[1]
    assets = int(sys.argv[2])
    sales_volume = int(sys.argv[3]) if len(sys.argv) > 3 else None

    team = lead_assignment(industry, assets, sales_volume)
    result = {"team": team, "industry": industry, "total_assets": assets}
    print(json.dumps(result))
