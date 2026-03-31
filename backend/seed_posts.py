"""
Seed 15 social media posts by the seeded tourists and guides.
Also adds likes, comments, and bookmarks for realistic data.

Usage (from /app):
    python manage.py shell < seed_posts.py
"""

from django.contrib.auth import get_user_model
from socials.models import Post, Bookmark

User = get_user_model()

# ── Post content pool ──────────────────────────────────────────────────────────

POSTS = [
    # Tourists
    {
        "email": "aarav.sharma@example.com",
        "textContent": "Just arrived at Everest Base Camp! The view is absolutely breathtaking. Worth every step of the 12-day trek. If you haven't done this yet, put it on your bucket list immediately! 🏔️ #EverestBaseCamp #Nepal #Trekking",
    },
    {
        "email": "priya.thapa@example.com",
        "textContent": "Explored Pashupatinath Temple today. The architecture and the spiritual energy here is something I've never experienced before. A must-visit for anyone coming to Kathmandu. 🙏 #Pashupatinath #Kathmandu #Travel",
    },
    {
        "email": "rohan.karki@example.com",
        "textContent": "Rafting on the Trishuli River was the most adrenaline-pumping experience of my life! Grade 3-4 rapids, crystal clear water, and stunning gorges on both sides. Highly recommend! 🚣 #Rafting #Trishuli #AdventureNepal",
    },
    {
        "email": "sita.poudel@example.com",
        "textContent": "Sunrise from Nagarkot this morning painted the sky in shades of gold and pink. The Himalayan panorama with Langtang and Ganesh Himal in the background made everything perfect. 🌄 #Nagarkot #Sunrise #HimalayanView",
    },
    {
        "email": "bikash.adhikari@example.com",
        "textContent": "Spent the day exploring Bhaktapur Durbar Square. The 55-window palace, Nyatapola temple, and the pottery squares are incredible. Don't forget to try the famous Juju Dhau (king curd)! 😍 #Bhaktapur #DurbarSquare #Heritage",
    },
    {
        "email": "nisha.tamang@example.com",
        "textContent": "The Annapurna Circuit was everything I dreamed of and more. 21 days, 160km, and memories that will last a lifetime. The people of the Mustang region are incredibly warm and welcoming. ❤️ #AnnapurnaCircuit #Trekking #Nepal",
    },
    {
        "email": "suraj.basnet@example.com",
        "textContent": "Paragliding over Pokhara with the Phewa Lake and Machhapuchhre (Fishtail Mountain) below me — this is peak Nepal! Absolutely unreal experience. 10/10 would do again tomorrow. 🪂 #Paragliding #Pokhara #Nepal",
    },
    {
        "email": "anita.gurung@example.com",
        "textContent": "Chitwan National Park jeep safari early this morning — spotted 2 rhinos, a wild elephant, and a crocodile by the river! The biodiversity here is incredible. Nepal is not just mountains! 🦏 #Chitwan #WildlifeSafari #Nepal",
    },
    {
        "email": "dipak.rai@example.com",
        "textContent": "Tried dal bhat at a local teahouse in Namche Bazaar — simple food, big flavors, unlimited refills. This is the fuel that powers trekkers through the Himalayas. Nothing beats it after a long day on the trail. 🍛 #DalBhat #NamcheBazaar #TrekkingFood",
    },
    {
        "email": "kamala.shrestha@example.com",
        "textContent": "Boudhanath Stupa at dusk is pure magic. The eyes of the Buddha watching over the valley, butter lamps flickering, monks chanting — I sat here for 2 hours just absorbing the peace. 🕯️ #Boudhanath #Kathmandu #Buddhism",
    },

    # Guides
    {
        "email": "pasang.sherpa@example.com",
        "textContent": "Just completed my 47th summit of Everest Base Camp with a group of 8 trekkers from Australia. Conditions were excellent this season. Remember: acclimatize properly, stay hydrated, and trust your guide. Safety first always! 🏔️ #EverestGuide #NepalGuide #Trekking",
    },
    {
        "email": "dorje.lama@example.com",
        "textContent": "The Annapurna Conservation Area is showing amazing recovery this year — more wildlife, cleaner trails. As guides it's our responsibility to educate trekkers about Leave No Trace principles. Let's keep Nepal's nature pristine for generations. 🌿 #ResponsibleTrekking #Annapurna #Conservation",
    },
    {
        "email": "mingma.dolkar@example.com",
        "textContent": "Taking a group through the hidden courtyards of Patan today. Most tourists only see the main Durbar Square but the real magic is in the back alleys — ancient stone water spouts (hitis), hidden temples, and local life unchanged for centuries. 🏛️ #Patan #HiddenNepal #CulturalTour",
    },
    {
        "email": "tenzin.norbu@example.com",
        "textContent": "Monsoon season in Bardia National Park means fewer tourists but incredible wildlife activity! Spotted a Bengal tiger at close range this morning near the Karnali River. A reminder why Bardia is Nepal's best-kept secret. 🐯 #BardiaWildlife #BengalTiger #NepalWildlife",
    },
    {
        "email": "lakpa.diki@example.com",
        "textContent": "Completed the Island Peak (Imja Tse) climb with 4 trekkers today — all first-time summiteers! At 6,189m, the view of Lhotse, Makalu and Ama Dablam is something that never gets old no matter how many times you stand here. Congratulations team! 🎉⛰️ #IslandPeak #Climbing #NepalGuide",
    },
]

print("\n🌱 Seeding social media posts...\n")

# ── Create Posts ───────────────────────────────────────────────────────────────
created_posts = []
skipped = 0

for p in POSTS:
    try:
        user = User.objects.get(email=p["email"])
    except User.DoesNotExist:
        print(f"  ⚠️  User not found: {p['email']} — run seed_users.py first!")
        skipped += 1
        continue

    post = Post.objects.create(
        user=user,
        textContent=p["textContent"],
    )
    created_posts.append(post)
    print(f"  ✅ Post by {user.fullName}: {p['textContent'][:60]}...")

# ── Add Likes ──────────────────────────────────────────────────────────────────
all_users = list(User.objects.filter(is_superuser=False))

for i, post in enumerate(created_posts):
    # Each post liked by a rotating subset of users
    likers = all_users[i % len(all_users) : i % len(all_users) + 5]
    for liker in likers:
        if liker != post.user:
            post.likedBy.add(liker)

# ── Add Bookmarks ──────────────────────────────────────────────────────────────
for i, post in enumerate(created_posts[:8]):  # bookmark first 8 posts
    bookmarker = all_users[(i + 5) % len(all_users)]
    if bookmarker != post.user:
        Bookmark.objects.get_or_create(user=bookmarker, post=post)

# ── Summary ────────────────────────────────────────────────────────────────────
print(f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Posts created    : {len(created_posts)}
❤️   Likes added     : ~{len(created_posts) * 4}
🔖  Bookmarks added : {min(8, len(created_posts))}
⚠️   Skipped         : {skipped}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")
