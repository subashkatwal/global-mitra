"""
Seed 15 random users (10 tourists + 5 guides) directly into the DB.
Bypasses OTP flow — users are created as verified + active.
 
Usage:
    python manage.py shell < seed_users.py
"""
 
from django.db import transaction
from django.utils import timezone
from accounts.models import GuideProfile
from django.contrib.auth import get_user_model
 
User = get_user_model()
 

 
TOURISTS = [
    {"fullName": "Aarav Sharma",    "email": "aarav.sharma@example.com",    "phoneNumber": "9841000001"},
    {"fullName": "Priya Thapa",     "email": "priya.thapa@example.com",     "phoneNumber": "9841000002"},
    {"fullName": "Rohan Karki",     "email": "rohan.karki@example.com",     "phoneNumber": "9841000003"},
    {"fullName": "Sita Poudel",     "email": "sita.poudel@example.com",     "phoneNumber": "9841000004"},
    {"fullName": "Bikash Adhikari", "email": "bikash.adhikari@example.com", "phoneNumber": "9841000005"},
    {"fullName": "Nisha Tamang",    "email": "nisha.tamang@example.com",    "phoneNumber": "9841000006"},
    {"fullName": "Suraj Basnet",    "email": "suraj.basnet@example.com",    "phoneNumber": "9841000007"},
    {"fullName": "Anita Gurung",    "email": "anita.gurung@example.com",    "phoneNumber": "9841000008"},
    {"fullName": "Dipak Rai",       "email": "dipak.rai@example.com",       "phoneNumber": "9841000009"},
    {"fullName": "Kamala Shrestha", "email": "kamala.shrestha@example.com", "phoneNumber": "9841000010"},
]
 
GUIDES = [
    {
        "fullName": "Pasang Sherpa",
        "email": "pasang.sherpa@example.com",
        "phoneNumber": "9841000011",
        "licenseNumber": "NTB-GUIDE-001",
        "licenseIssuedBy": "Nepal Tourism Board",
        "bio": "Expert trekking guide with 10 years experience in Everest region.",
    },
    {
        "fullName": "Dorje Lama",
        "email": "dorje.lama@example.com",
        "phoneNumber": "9841000012",
        "licenseNumber": "NTB-GUIDE-002",
        "licenseIssuedBy": "Nepal Tourism Board",
        "bio": "Certified mountaineering guide specializing in Annapurna circuit.",
    },
    {
        "fullName": "Mingma Dolkar",
        "email": "mingma.dolkar@example.com",
        "phoneNumber": "9841000013",
        "licenseNumber": "NTB-GUIDE-003",
        "licenseIssuedBy": "Nepal Tourism Board",
        "bio": "Experienced cultural and heritage tour guide based in Kathmandu.",
    },
    {
        "fullName": "Tenzin Norbu",
        "email": "tenzin.norbu@example.com",
        "phoneNumber": "9841000014",
        "licenseNumber": "NTB-GUIDE-004",
        "licenseIssuedBy": "Nepal Tourism Board",
        "bio": "Wildlife and nature guide with expertise in Chitwan and Bardia.",
    },
    {
        "fullName": "Lakpa Diki",
        "email": "lakpa.diki@example.com",
        "phoneNumber": "9841000015",
        "licenseNumber": "NTB-GUIDE-005",
        "licenseIssuedBy": "Nepal Tourism Board",
        "bio": "High altitude trekking guide, summited Mera Peak and Island Peak.",
    },
]
 
DEFAULT_PASSWORD = "Test@1234"
 
created_tourists = 0
created_guides   = 0
skipped          = 0
 
print("\n Starting user seed...\n")
 
#  Create Tourists 
for t in TOURISTS:
    if User.objects.filter(email=t["email"]).exists():
        print(f"  ⚠️  Skipped (exists): {t['email']}")
        skipped += 1
        continue
    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=t["email"],
                email=t["email"],
                password=DEFAULT_PASSWORD,
                fullName=t["fullName"],
                phoneNumber=t["phoneNumber"],
                role="TOURIST",
            )
            user.verified = True
            user.isActive = True
            user.save()
            created_tourists += 1
            print(f"   Tourist: {t['fullName']} ({t['email']})")
    except Exception as e:
        print(f"   Failed {t['email']}: {e}")
        skipped += 1
 
#  Create Guides 
for g in GUIDES:
    if User.objects.filter(email=g["email"]).exists():
        print(f"   Skipped (exists): {g['email']}")
        skipped += 1
        continue
    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=g["email"],
                email=g["email"],
                password=DEFAULT_PASSWORD,
                fullName=g["fullName"],
                phoneNumber=g["phoneNumber"],
                role="GUIDE",
            )
            user.verified = True
            user.isActive = True
            user.save()
 
            GuideProfile.objects.create(
                user=user,
                licenseNumber=g["licenseNumber"],
                licenseIssuedBy=g["licenseIssuedBy"],
                bio=g["bio"],
                verificationStatus="APPROVED",
            )
            created_guides += 1
            print(f"   Guide:   {g['fullName']} ({g['email']}) — {g['licenseNumber']}")
    except Exception as e:
        print(f"   Failed {g['email']}: {e}")
        skipped += 1
 
