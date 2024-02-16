# Send GET Request to http://${URL}/api/user/getAllEvents

import requests

import threading


# total_success = 0
# response_codes = []

# def send_get_all_events():
#     try:
#         response = requests.get("http://${URL}/api/user/getAllEvents")
#         response_codes.append(response.status_code)
#         if response.status_code == 200:
#             global total_success
#             total_success += 1
#     except Exception as e:
#         response_codes.append(502)

# threads = []

# for i in range(10):
#     for i in range(100):
#         t = threading.Thread(target=send_get_all_events)
#         threads.append(t)
#         t.start()

#     for t in threads:
#         t.join()

# print("Done")
# print("Total Success: ", total_success)

login_success = 0
response_codes = []

def login():
    login_url = 'http://${URL}/api/auth/loginStudent'

    payload = {
        "studentEmail": "cb.en.u4cse21001@cb.students.amrita.edu",
        "studentPassword": "4bc3446b672d30ca045eb57cd661347c27a7ca3edd80cc2fe320159800f8c856"
    }

    try:
        response = requests.post(login_url, json=payload)

        if response.status_code == 200:
            response_codes.append(200)
            global login_success
            login_success += 1
        else:
             response_codes.append(response.status_code)
    except Exception as e:
        response_codes.append(502)


# Concurrently send 8 requests. Total send 10 such sets

threads = []

for i in range(1000):
    for j in range(8):
        t = threading.Thread(target=login)
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

print("Total Success: ", login_success)

response_code_data = {}

for code in response_codes:
    if code in response_code_data:
        response_code_data[code] += 1
    else:
        response_code_data[code] = 1

print(response_code_data)