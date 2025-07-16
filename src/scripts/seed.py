from collections import Counter
import json
from faker import Faker 
import random
from faker.providers import DynamicProvider
import requests
import time




tournaments=["Tournament 1", "Tournament 2","Tournament 3"]

fight_status=["ended",
              "in progress",
              "ended",
              "idle"]

match_result=["Winner",
              "Loser"]

body_parts=["head",
         "body"]

strikes=[["Kick","head"],
         ["Backfist","head"],
         ["Cross","head"],
         ["Spinning kick","head"],

         ["Kick","body"],
         ["Backfist","body"],
         ["Cross","body"],
         ["Spinning kick", "body"]
         ]



fouls=["Disrespect",
       "Illegal shot",
       "Out",
       "",
       "",
       "",
       "",
       "",
       "",
       "",
       ""]

result_provider = DynamicProvider(
    provider_name="match_result",
    elements=match_result
)
tournaments_provider= DynamicProvider(
    provider_name="tournaments",
    elements=tournaments
)



fouls_provider= DynamicProvider(
    provider_name="fouls",
    elements=fouls
)


body_part_provider = DynamicProvider(
    provider_name="body_part",
    elements=body_parts
)

f = Faker('es_ES')

strikes_provider = DynamicProvider(
    provider_name="strikes",
    elements=strikes
)

f.add_provider(result_provider)
f.add_provider(fouls_provider)
f.add_provider(strikes_provider)
f.add_provider(strikes_provider)
f.add_provider(body_part_provider)

def generate_tournament():
    tournament = dict()
    tournament["id"]=f.uuid4()
    tournament["organizer"]=f.name()
    tournament["location"]=f.country()
    tournament["starting_date"]="x"
    tournament["ending_date"]="x"
    return tournament

def generate_category(tournament_id):
    category= dict()
    category["tournament_id"]=tournament_id
    category["id"]=f.uuid4()
    category["weight"]=f.random_int(40,100)
    category["age"]=f.random_int(7,100)
    category["sex"]=["Male","Female"][f.random_int(0,1)]
    return category



def get_win_rate(fights_data, fighter_id_to_check):
    """
    Calculates the win rate for a specific fighter based on a list of fights.

    Args:
        fights_data (list of dict): A list where each dictionary represents a fight,
                                    following the defined structure.
        fighter_id_to_check (str): The unique ID of the fighter for whom to calculate
                                   the win rate.

    Returns:
        float: The win rate as a percentage (e.g., 0.75 for 75%).
               Returns 0.0 if the fighter has no recorded fights.
    """
    total_fights = 0
    wins = 0

    for fight in fights_data:
        # Check if the fighter participated in this fight
        participated = False
        if fight["red_corner"]["fighter_id"] == fighter_id_to_check:
            participated = True
        elif fight["blue_corner"]["fighter_id"] == fighter_id_to_check:
            participated = True

        if participated:
            total_fights += 1
            # Check if the fighter won this fight
            if fight["winner"] == get_fighter_corner(fighter_id_to_check, fight):
                wins += 1

    if total_fights == 0:
        return 0.0  # Avoid division by zero if the fighter has no recorded fights

    win_rate = wins / total_fights
    return win_rate*100



def generate_fouls(amount):
    _fouls=[]
    for i in range(amount):
        _fouls.append(f.fouls())
    return _fouls

def generate_strikes(amount):
    _strikes=[]
    for i in range(amount):
        _strikes.append(f.strikes())
    return _strikes

def generate_fight(fighter_a, fighter_b):
    fight_id=f.uuid4()
    corner_results=generate_corner_results(fight_id,fighter_a, fighter_b)

    fight={
        "id":fight_id,
        "category_id":"",
        "red_corner":corner_results["red"],
        "blue_corner":corner_results["blue"],
        "ring":random.randint(1,6),
        "winner":corner_results["winner"],
        "loser":corner_results["loser"],
        "judge":f.name(),
        "status":"in progress",
        "date":"x"#f.date()
    }
    return fight

def generate_corner_results(fight_id,fighter_a, fighter_b):
    result={"red":{},"blue":{},"winner":"", "loser":""}
    corners=["red","blue"]
    fighters=[fighter_a,fighter_b]
    winner=corners[random.randint(0,1)]

    if winner=="red":
        red_result=generate_corner_result(fight_id,fighter_a["id"],1,9)
        red_result["result"]="Winner"
        blue_result=generate_corner_result(fight_id,fighter_b["id"],0,red_result["score"])
        blue_result["result"]="Loser"
        result["loser"]="blue"
        result["red"]=red_result
        result["blue"]=blue_result

    else:
        blue_result=generate_corner_result(fight_id,fighter_b["id"],1,9)
        blue_result["result"]="Winner"
        red_result=generate_corner_result(fight_id,fighter_a["id"],0,blue_result["score"])
        red_result["result"]="Loser"
        result["loser"]="red"
        result["red"]=red_result
        result["blue"]=blue_result

    result["winner"]=winner

    return result

def get_average_win_gap(fights_data, fighter_id_to_check):
    """
    Calculates the average score gap in fights won by a specific fighter.

    Args:
        fights_data (list of dict): A list where each dictionary represents a fight,
                                    following the defined structure.
        fighter_id_to_check (str): The unique ID of the fighter for whom to calculate
                                   the average score gap in wins.

    Returns:
        float: The average score gap in points for the fights won by the fighter.
               Returns 0.0 if the fighter has no wins or no relevant fights.
    """
    score_gaps = []

    for fight in fights_data:
        # Check if the current fighter won this fight
        if fight["winner"] == get_fighter_corner(fighter_id_to_check,fight):
            # Determine which corner the fighter was in
            if fight["red_corner"]["fighter_id"] == fighter_id_to_check:
                fighter_score = fight["red_corner"]["score"]
                opponent_score = fight["blue_corner"]["score"]
            elif fight["blue_corner"]["fighter_id"] == fighter_id_to_check:
                fighter_score = fight["blue_corner"]["score"]
                opponent_score = fight["red_corner"]["score"]
            else:
                # This should not happen if "winner" is correctly set to fighter_id_to_check
                # and fighter_id_to_check is in either red_corner or blue_corner
                continue # Skip if fighter_id_to_check is not found in either corner (safety)

            # Calculate the score gap (fighter's score - opponent's score)
            gap = fighter_score - opponent_score
            score_gaps.append(gap)

    if not score_gaps:
        return 0.0  # No wins found for this fighter

    # Calculate the average of the score gaps
    average_gap = sum(score_gaps) / len(score_gaps)
    return average_gap




def generate_corner_result(fight_id, fighter_id, min_points, max_points):
    corner_result={"id":f.uuid4(),
                   "fighter_id":fighter_id,
                   "fight_id":fight_id,
                    "strikes_landed":generate_strikes(8),
                   "fouls":generate_fouls(3),
                   "score":random.randint(min_points,max_points-1),
    }
    return corner_result

def get_name_by_id(id, fighters):
    name=""
    for i in fighters:
        if i["id"]==id:
            name = i["name"]+" "+i["lastname"]
            break
    return name


def generate_fighter():
    fighter = {"id":f.uuid4(),
               "academy":"?",
               "name":f.first_name(),
               "lastname":f.last_name(),
                "weight":random.randint(40,80),
                "birthday": "x",#f.date_of_birth(),
               "fights":[]#,
               # "stats":{}
    }
    return fighter


def overall_strike_percentages(all_strikes):
    total_strikes_overall = len(all_strikes)

    if total_strikes_overall == 0:
        return {} # Return an empty dict if there are no strikes at all

    # STEP 2: Count occurrences of each strike type in the flattened list
    strike_counts_overall = Counter(all_strikes)
    
    overall_percentages = {}
    # STEP 3: Calculate percentages based on the total overall strikes
    for strike_type, count in strike_counts_overall.items():
        percentage = (count / total_strikes_overall) * 100
        overall_percentages[strike_type] = round(percentage, 2)
    
    return overall_percentages

def get_fighter_corner(fighter_id, fight):
    # print(fight)
    if fighter_id==fight["red_corner"]["fighter_id"]:
        return "red"
    else:
        return "blue"

def get_opp_corner(fighter_id, fight):
    if fighter_id!=fight["red_corner"]["fighter_id"]:
        return "red"
    else:
        return "blue"

def get_all_strikes(fights, fighter_id):

    general_arr=[]
    for i in fights:
        corner=get_fighter_corner(fighter_id,i)
        for j in i[corner+"_corner"]["strikes_landed"]:
            general_arr.append(j[0])
    return general_arr


def checkWin(fighter_id, fight):
    fighter_corner=get_fighter_corner(fighter["id"], fight)
    if fighter_corner==fight["winner"]:
        return True
    else: 
        return False

def get_fighter_record(fighter):
    record=[0,0]
    for fight in fighter["fights"]:
        if checkWin(fighter["id"], fight):
            record[0]+=1
        else:
            record[1]+=1
    return record


def get_fighter_type(fighter):
    kicks=fighter["stats"]["Kick"]+fighter["stats"]["Spinning kick"]
    punches=fighter["stats"]["Backfist"]+fighter["stats"]["Cross"]

    diff= abs(kicks-punches)
    if diff<2:
        return ["Balanced", kicks, punches]
    elif punches>kicks:
        return ["Boxer type", punches]
    else:
        return ["Kicker type", kicks]


fighters=[]
fights=[]
tournaments=[]
categories=[]


def format_fight(fight):
    red_name=get_name_by_id(fight["red_corner"]["fighter_id"], fighters)
    red_score=fight["red_corner"]["score"]
    blue_name=get_name_by_id(fight["blue_corner"]["fighter_id"], fighters)
    blue_score=fight["blue_corner"]["score"]

    formated={
        "id":fight["id"],
        "category_id":fight["category_id"],
        "ring": fight["ring"],
        "athlete_red": red_name,
        "athlete_blue": blue_name,
        "points_red": red_score,
        "points_blue": blue_score,
        "status": "in progress",
        "winner":"nd"
    }
    return formated

port=3000
n_categories=5
n_tournaments=5
n_fighters=40
n_fights_per_fighter=50


for i in range(n_tournaments):
    tournaments.append(generate_tournament())
    for i in range(n_categories):
        tournament_id=tournaments[len(tournaments)-1]["id"]
        category=generate_category(tournament_id)
        categories.append(category)
        requests.post("http://localhost:"+str(port)+"/tournaments/categories",json=category)

print("categories loaded")
time.sleep(1)

for tournament in tournaments:
    requests.post("http://localhost:"+str(port)+"/tournaments",json=tournament)

for i in range(n_fighters):
    fighter=generate_fighter()
    fighters.append(fighter)

print("tournaments loaded")
time.sleep(1)

for i in range(n_fighters):
    for j in range(n_fights_per_fighter):
        rand_num=random.randint(0,len(fighters)-1)
        while(rand_num==i):
            rand_num=random.randint(0,len(fighters)-1)
        fight=generate_fight(fighters[i],fighters[rand_num])
        fight["category_id"]=categories[f.random_int(0,len(categories)-1)]["id"]
        fights.append(fight)
        # fighters[i]["fights"].append(fight)


print("fights loaded")
time.sleep(1)


# for i in range(len(fighters)):
#     all_strikes=get_all_strikes(fighters[i]["fights"], fighters[i]["id"])
#     analytics=overall_strike_percentages(all_strikes)
#     fighters[i]["stats"]["strikes"]=analytics

fighter_id=fighters[0]["id"]


for i in range(len(fighters)): 

    print("current athlete ---------> "+fighters[i]["name"]+" "+fighters[i]["lastname"])

    formatted_athlete={"id":fighters[i]["id"],
                        "name":fighters[i]["name"],
                        "lastname":fighters[i]["lastname"]
    }
    # print(fighters[i]["stats"])
    athlete_info={"id":fighters[i]["id"],"name":fighters[i]["name"],"lastname":fighters[i]["lastname"]}
    # print(athlete_info)
    # requests.post("http://localhost:3000/fights", formatted_fight)
    # print(json.dumps(athlete_info,indent=4))
    requests.post("http://localhost:"+str(port)+"/athletes", json=athlete_info)


for fight in fights:
    formatted_fight=format_fight(fight)
    print(get_name_by_id(fight["red_corner"]["fighter_id"],fighters)+" VS "+get_name_by_id(fight["blue_corner"]["fighter_id"],fighters))
    corner_data={"red":fight["red_corner"],"blue":fight["blue_corner"]}

    requests.post("http://localhost:"+str(port)+"/fights/results", json=corner_data)
    requests.post("http://localhost:"+str(port)+"/fights", formatted_fight)


print("athletes loaded")










