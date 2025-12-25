#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量下载智绘AI生成的所有游戏资产
总计689张图片
"""

import requests
import os
from pathlib import Path
import time

# 基础目录
BASE_DIR = Path("F:/workspace/github/Footnote/assets/images")

# 所有图片URL和分类
ALL_IMAGES = [
    # === 场景物件 (Scene Objects) - chatId 23371, 23375 ===
    # 居住环
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591459763_22e9b661-07c5-4b94-8522-bab4dc430d4c_small.webp", "category": "objects/residential", "name": "bed_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591465426_843fec78-69cd-4fc4-a9f1-731761bd20ac_small.webp", "category": "objects/residential", "name": "bed_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591464228_ea002080-8bff-4ed1-bd59-2e550f685e3a_small.webp", "category": "objects/residential", "name": "bed_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591463872_886e5207-e583-42d9-8a36-53d8d98b7ee1_small.webp", "category": "objects/residential", "name": "bed_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591476292_f6f080ed-0601-4b44-9d05-b9f5ca8ef89c_small.webp", "category": "objects/residential", "name": "desk_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591474345_544dddd5-c20e-44ee-9707-896934e7ce0b_small.webp", "category": "objects/residential", "name": "desk_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591481934_57fff098-2668-4558-9afb-311864ac17ef_small.webp", "category": "objects/residential", "name": "desk_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591487478_aad9b0a2-7e7f-41b8-b185-d0a2ab297041_small.webp", "category": "objects/residential", "name": "desk_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591488474_0a5c92fc-dd44-4426-846c-302a316a87b3_small.webp", "category": "objects/residential", "name": "lamp_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591495626_a6de3347-bf0d-4933-9e97-063c5fc81fd4_small.webp", "category": "objects/residential", "name": "lamp_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591481638_31418427-94c1-4af6-8786-6584dbfb53dc_small.webp", "category": "objects/residential", "name": "lamp_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591493467_21f0a62f-1a02-4107-b2ca-7a77d2d80775_small.webp", "category": "objects/residential", "name": "lamp_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591507441_f88e6393-906f-4d57-92c7-3221d3f4209b_small.webp", "category": "objects/residential", "name": "door_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591496436_522acbe6-959f-4a19-940e-f4e3279d5a8b_small.webp", "category": "objects/residential", "name": "door_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591499113_be7dbbea-03d4-483c-ac1a-a34c1f285884_small.webp", "category": "objects/residential", "name": "door_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591498338_554576f2-ca8c-4bfd-b821-82d7e1d6afd0_small.webp", "category": "objects/residential", "name": "door_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591506704_1a2aa201-e7eb-44ce-be58-59628564a9af_small.webp", "category": "objects/residential", "name": "plant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591499418_daf6c317-0fb1-4467-8068-1438de9f63ef_small.webp", "category": "objects/residential", "name": "plant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591500481_163cea20-2273-4145-87fa-56c4c93abc7d_small.webp", "category": "objects/residential", "name": "plant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591502353_f47e9295-3c57-4b6d-89b7-805f3d9aafbb_small.webp", "category": "objects/residential", "name": "plant_4.webp"},
    
    # 市政环
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591533902_043c0ff8-7c18-40f5-9601-4bcaa52c28fe_small.webp", "category": "objects/municipal", "name": "office_desk_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591521593_f12d679f-498d-45d5-9980-5a6f2d7dc5bb_small.webp", "category": "objects/municipal", "name": "office_desk_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591532059_a9884980-9483-4d6f-9159-f18ad7616e82_small.webp", "category": "objects/municipal", "name": "office_desk_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591522541_0832c484-fe22-440b-a69a-0488ca44eb54_small.webp", "category": "objects/municipal", "name": "office_desk_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594666255_b580e4f4-2ace-42f7-a66d-b2c5a7bdab3b_small.webp", "category": "objects/municipal", "name": "filing_cabinet_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594670059_6d06bb9d-6686-4b61-9889-9856c8035a5e_small.webp", "category": "objects/municipal", "name": "filing_cabinet_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594676745_75f8157e-e071-44fd-b344-7de501114f58_small.webp", "category": "objects/municipal", "name": "filing_cabinet_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594666412_60b34978-5916-443d-ba5d-8e80e3002007_small.webp", "category": "objects/municipal", "name": "filing_cabinet_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594680972_97369681-4c70-42eb-a765-b3353f320f40_small.webp", "category": "objects/municipal", "name": "monitor_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594682404_93f37ff3-0500-4a10-ba09-2c7fa47346a5_small.webp", "category": "objects/municipal", "name": "monitor_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594684166_fd487a33-abd7-460f-a9b1-1df9da59bb03_small.webp", "category": "objects/municipal", "name": "monitor_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594754509_ede4544d-9b2a-4e79-9d5f-7906e6e730e9_small.webp", "category": "objects/municipal", "name": "monitor_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594680124_f3ef7fc9-bd2f-4f21-acdc-78977ad3387a_small.webp", "category": "objects/municipal", "name": "barrier_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594681833_cd6442db-1198-4526-898b-581ad65259d9_small.webp", "category": "objects/municipal", "name": "barrier_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594680037_a319a6b4-d0bd-4076-988b-fa61aad0dbee_small.webp", "category": "objects/municipal", "name": "barrier_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594684014_ef5836bd-1233-4699-b605-6c15b51022ae_small.webp", "category": "objects/municipal", "name": "barrier_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594689770_71c978b3-62f5-4a02-95df-08aa9e032116_small.webp", "category": "objects/municipal", "name": "sign_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594691380_487a813e-43f4-4249-a7b7-a4046e5099c0_small.webp", "category": "objects/municipal", "name": "sign_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594692931_e20e4c8f-e1b3-4947-9abd-f46c7778fd78_small.webp", "category": "objects/municipal", "name": "sign_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594689273_2d6b9413-8440-48b7-8fd8-58a66c9386dc_small.webp", "category": "objects/municipal", "name": "sign_4.webp"},
    
    # 档案巷
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591717072_8969ea70-ea20-40c1-9ada-cb7659f80471_small.webp", "category": "objects/archive", "name": "bookshelf_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591722888_785414e7-20f4-4e3c-bc16-c5232e6548b6_small.webp", "category": "objects/archive", "name": "bookshelf_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591712146_37693d33-5994-4389-8481-8fa2ab521398_small.webp", "category": "objects/archive", "name": "bookshelf_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591729842_d8594977-cb4d-4794-a15a-f443463c6049_small.webp", "category": "objects/archive", "name": "bookshelf_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591713606_c80f272d-6631-4c48-ad22-eb1819b6112d_small.webp", "category": "objects/archive", "name": "oil_lamp_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591723728_bfcdd83b-a632-4c85-8e34-05bfb61b2811_small.webp", "category": "objects/archive", "name": "oil_lamp_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591723633_3bde413c-d83e-4250-89e5-06191fe1e42a_small.webp", "category": "objects/archive", "name": "oil_lamp_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591729462_daa3d6b4-9b29-49e1-9c54-189df97db954_small.webp", "category": "objects/archive", "name": "oil_lamp_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594707721_c4981419-c335-4ec1-889a-63fb85ccca58_small.webp", "category": "objects/archive", "name": "old_books_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594702802_d493f06c-ce36-429e-adb4-e54a948080cd_small.webp", "category": "objects/archive", "name": "old_books_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594699910_f89fc15f-1134-467c-9bc3-f59f84d1867c_small.webp", "category": "objects/archive", "name": "old_books_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594702606_ceaff85e-d8e1-4a12-8e6c-da34cff4aee5_small.webp", "category": "objects/archive", "name": "old_books_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594716900_4b608973-59ee-4cea-a562-36bf0cfe362b_small.webp", "category": "objects/archive", "name": "binding_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594714783_3a164d60-8d21-4d94-b47e-fbf93dedd3a8_small.webp", "category": "objects/archive", "name": "binding_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594716150_2e9f2c9e-58a0-4cee-b55f-5eb044fa960d_small.webp", "category": "objects/archive", "name": "binding_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594707377_f738b1e2-9d2b-479f-9d3e-66d9fba6afb1_small.webp", "category": "objects/archive", "name": "binding_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594759127_0b5b13d3-4a68-4ce6-85b5-79f31e5c9cb2_small.webp", "category": "objects/archive", "name": "map_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594716912_09d2d076-5be8-47b2-899f-79996af8c73a_small.webp", "category": "objects/archive", "name": "map_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594719557_299d4d48-36c3-4c44-9a0a-64a6bd252204_small.webp", "category": "objects/archive", "name": "map_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594723561_e5199b8a-6de6-40e1-b9d6-167293929da3_small.webp", "category": "objects/archive", "name": "map_4.webp"},
    
    # 诊疗台
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591728501_c827b144-48f6-4efe-8336-1e69d456c0a0_small.webp", "category": "objects/clinic", "name": "hospital_bed_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591742164_4be8fb94-9691-4500-abaa-5aa77e5a09a8_small.webp", "category": "objects/clinic", "name": "hospital_bed_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591730468_a1d15285-daed-44df-a7ab-c7f73fdce499_small.webp", "category": "objects/clinic", "name": "hospital_bed_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591737211_6ca27427-2b1c-4ae3-b881-0f45b59883db_small.webp", "category": "objects/clinic", "name": "hospital_bed_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594738496_2359c3cc-187d-4926-b9f7-54024c62dcf1_small.webp", "category": "objects/clinic", "name": "medical_equip_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594747227_32727620-80c0-4456-8b82-42fef612e9e4_small.webp", "category": "objects/clinic", "name": "medical_equip_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594738471_f56761e7-e6a5-4cef-a9bd-2d6b4607e38f_small.webp", "category": "objects/clinic", "name": "medical_equip_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594751739_96490f78-103c-4c92-b9ae-c71c6940a6cb_small.webp", "category": "objects/clinic", "name": "medical_equip_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594734090_c7ec1bae-e08e-4beb-bc3a-cb51e176e8fe_small.webp", "category": "objects/clinic", "name": "medicine_cabinet_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594734966_ecc4bb8f-e505-4b30-88fc-ee921868d045_small.webp", "category": "objects/clinic", "name": "medicine_cabinet_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594735967_17bc3132-0908-4cab-9871-68d77a7b8afd_small.webp", "category": "objects/clinic", "name": "medicine_cabinet_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594737009_55838248-35fb-4687-aa60-8a70358c582e_small.webp", "category": "objects/clinic", "name": "medicine_cabinet_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594745780_53b9a081-2cac-4706-adbb-bf6990e5cdf3_small.webp", "category": "objects/clinic", "name": "chair_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594742860_5792192e-2151-4829-8664-afabb01173b0_small.webp", "category": "objects/clinic", "name": "chair_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594741759_7d66b67e-8af0-4b88-9c87-8fb35a2e3c08_small.webp", "category": "objects/clinic", "name": "chair_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594741496_edb16317-6902-4972-90be-b88911a5131e_small.webp", "category": "objects/clinic", "name": "chair_4.webp"},
    
    # 礼堂街
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591754973_fc754011-af2b-4294-9f4c-2ea05961ec6e_small.webp", "category": "objects/temple", "name": "altar_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591743150_9d76708f-724e-42e0-84bf-0fec0634e612_small.webp", "category": "objects/temple", "name": "altar_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591738094_6b781aaa-5497-4484-aefc-4e2af6e8ea5f_small.webp", "category": "objects/temple", "name": "altar_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591739714_8fcb1271-fee0-44e4-bb00-644ab1fa99c5_small.webp", "category": "objects/temple", "name": "altar_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594769090_76ca47ce-b74e-4594-be49-22ccd082412f_small.webp", "category": "objects/temple", "name": "candle_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594751875_150c7402-edd7-4693-a135-41b16165f4fd_small.webp", "category": "objects/temple", "name": "candle_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594752962_8fc259f9-66a6-48f6-9791-d5905905f482_small.webp", "category": "objects/temple", "name": "candle_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594765644_1b5eff6c-730f-4f49-ae65-2bec8aa3ba8f_small.webp", "category": "objects/temple", "name": "candle_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594765394_4ae9a478-e04e-492b-bc03-26aea30fcea5_small.webp", "category": "objects/temple", "name": "statue_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594768301_d10ae340-1a98-4d66-a824-af708a5b1495_small.webp", "category": "objects/temple", "name": "statue_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594764970_323c33cb-6faf-4092-b382-9ca39329fdec_small.webp", "category": "objects/temple", "name": "statue_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594759666_fcf42d15-5d54-4f8f-b96e-ed2c5cc42cfe_small.webp", "category": "objects/temple", "name": "rune_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594760619_94ea16fc-2607-4136-b9e1-4af4c455f100_small.webp", "category": "objects/temple", "name": "rune_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594765892_5a708fe0-fd76-4596-a9d2-0385f1f7c958_small.webp", "category": "objects/temple", "name": "rune_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594763207_fe1c89be-610c-433c-b1d5-35b25749006e_small.webp", "category": "objects/temple", "name": "rune_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594788346_c87ba63c-4aa2-4677-9bb8-b9b478c993ac_small.webp", "category": "objects/temple", "name": "ritual_bowl_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594777014_8abba701-238c-405e-9590-abf6f734cd7e_small.webp", "category": "objects/temple", "name": "ritual_bowl_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594768017_d412c7b4-0393-48d9-88c9-df170cb10f93_small.webp", "category": "objects/temple", "name": "ritual_bowl_3.webp"},
    
    # 边缘断口
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591737598_43cc3d55-5978-4afd-9ac0-c98f5da4bc63_small.webp", "category": "objects/edge", "name": "crack_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591745677_82a2219c-aaf2-406b-a3c6-a08268bd0640_small.webp", "category": "objects/edge", "name": "crack_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591743685_2fbf3cf8-a7e9-4a64-969e-c58264b74ca0_small.webp", "category": "objects/edge", "name": "crack_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766591735450_9e827383-cf42-4a1c-bbc5-6e9072e4caec_small.webp", "category": "objects/edge", "name": "crack_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594785390_41d6451c-15c7-4ba8-a5fd-bb2f82529091_small.webp", "category": "objects/edge", "name": "distorted_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594786023_86a7c40b-3305-4361-9067-5b94460fd07e_small.webp", "category": "objects/edge", "name": "distorted_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594782638_acfe1d9b-8f69-4b49-811e-8b74377c45d2_small.webp", "category": "objects/edge", "name": "distorted_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594782478_4c31832b-90cb-49f6-85bb-4a173dbf9239_small.webp", "category": "objects/edge", "name": "distorted_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594810443_1afe9085-3667-48ea-859a-3746be3db8fd_small.webp", "category": "objects/edge", "name": "warning_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594792511_ae5cde0d-b2b8-4822-91f1-41f994f874f2_small.webp", "category": "objects/edge", "name": "warning_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594789769_0613057c-ec3c-4c7c-b0db-16d4bac5e5cb_small.webp", "category": "objects/edge", "name": "warning_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594789832_4778f7e0-c9eb-4358-bc25-d8efedd751ab_small.webp", "category": "objects/edge", "name": "warning_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594790936_fc6fd21b-1974-4f4a-aa0a-9f353b210b58_small.webp", "category": "objects/edge", "name": "ruins_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594805236_fd5c1491-8c11-41c7-b9f8-427657ba056c_small.webp", "category": "objects/edge", "name": "ruins_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594797523_cc02944c-e15f-4817-b041-b0a266f635db_small.webp", "category": "objects/edge", "name": "ruins_3.webp"},
    
    # 生活用品
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594671141_85e98c0c-f335-4ff4-9380-96fbfd69e597_small.webp", "category": "objects/residential", "name": "household_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594663156_8d856693-b116-4612-bd36-e1972535cc96_small.webp", "category": "objects/residential", "name": "household_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594663172_d168e38a-a1f3-423b-a564-f034eab9fc70_small.webp", "category": "objects/residential", "name": "household_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594665095_36045579-524e-4a27-8d71-a0082d599789_small.webp", "category": "objects/residential", "name": "household_4.webp"},
]

# 可动物件动画
ANIMATED_OBJECTS = [
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592084491_937b4395-5f4d-4f4a-87ac-83f2b1f7d56d_small.webp", "category": "objects/animated/lamp", "name": "lamp_flicker_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592080568_5af9cc9a-3d41-4d5a-afaa-ee11bbb27a88_small.webp", "category": "objects/animated/lamp", "name": "lamp_flicker_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592071532_ce3bcdd5-25b0-4f25-bfa9-9278473a2f41_small.webp", "category": "objects/animated/lamp", "name": "lamp_flicker_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592083544_5aa9dcf0-a3b5-4e6a-841a-b33561bf03f7_small.webp", "category": "objects/animated/lamp", "name": "lamp_flicker_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592100258_7bdeac45-d82f-4a23-98af-9cc1f94fc403_small.webp", "category": "objects/animated/oil_lamp", "name": "oil_lamp_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592108171_3a1c6206-5d4b-4fb5-8227-3f9ac10f23cd_small.webp", "category": "objects/animated/oil_lamp", "name": "oil_lamp_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592103627_fdde7559-20c1-4b1d-a4e9-6b10f6373efc_small.webp", "category": "objects/animated/oil_lamp", "name": "oil_lamp_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592101107_346c96f4-6a77-4dab-9bc6-9030341cebdb_small.webp", "category": "objects/animated/oil_lamp", "name": "oil_lamp_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592111446_0f10df7d-303e-4d9a-be11-e4305bcb2aef_small.webp", "category": "objects/animated/candle", "name": "candle_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592109022_01c49dd1-04cb-45b6-98a0-558a2139b9a7_small.webp", "category": "objects/animated/candle", "name": "candle_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592118950_689bf146-a42c-44ba-804e-fcc3f45c72f9_small.webp", "category": "objects/animated/candle", "name": "candle_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592115575_694ac9f6-672f-40c4-857c-25d05c1697a9_small.webp", "category": "objects/animated/candle", "name": "candle_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592137324_455c3be3-5c95-48d6-9959-7b2528f3e973_small.webp", "category": "objects/animated/monitor", "name": "monitor_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592141663_faea3f81-ba92-4a44-a354-cb0152e1c878_small.webp", "category": "objects/animated/monitor", "name": "monitor_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592136920_b9c40807-72ae-427c-9602-4fed68b4fab9_small.webp", "category": "objects/animated/monitor", "name": "monitor_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592134148_c867d0b3-7164-4579-9cfd-68153c25c0cd_small.webp", "category": "objects/animated/monitor", "name": "monitor_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592153459_63113057-33a8-4356-bf6e-bdd591b5326c_small.webp", "category": "objects/animated/crack", "name": "crack_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592160050_76b5dc06-ad28-4b91-85e3-0f4f52d4cf3e_small.webp", "category": "objects/animated/crack", "name": "crack_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592147156_c1e6f551-15b8-4015-b3e9-cf8042e4e127_small.webp", "category": "objects/animated/crack", "name": "crack_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592156979_c0f44e92-012b-4688-b4b4-eaca51b19236_small.webp", "category": "objects/animated/crack", "name": "crack_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592155261_b92381c1-f90c-428f-b4a1-767598e4398b_small.webp", "category": "objects/animated/rune", "name": "rune_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592157512_f5ca9492-2435-42ac-b475-71e2da905fce_small.webp", "category": "objects/animated/rune", "name": "rune_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592172960_f028753b-0c09-4b2a-82e6-a15cba392f4d_small.webp", "category": "objects/animated/rune", "name": "rune_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592170805_e4d3b884-eca2-455e-8fba-2a2193527e1c_small.webp", "category": "objects/animated/rune", "name": "rune_4.webp"},
]

# 特效
EFFECTS = [
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592428444_98a099e1-b249-4d61-a788-50dd628d9713_small.webp", "category": "effects/depth_perception", "name": "depth_perception_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592422292_7deb8bd7-c01f-4bff-adeb-3fca3d32954f_small.webp", "category": "effects/depth_perception", "name": "depth_perception_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592443546_ce0b98ae-fd21-4764-96d7-632bac031b51_small.webp", "category": "effects/depth_perception", "name": "depth_perception_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592422881_7693e4bd-2bb7-4385-a78a-08b911dce260_small.webp", "category": "effects/depth_perception", "name": "depth_perception_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592445199_6368efc5-7d13-4731-8c70-9d2883e16359_small.webp", "category": "effects/depth_intervention", "name": "depth_intervention_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592448955_b45506fa-0c91-481b-8010-cb2c203594ec_small.webp", "category": "effects/depth_intervention", "name": "depth_intervention_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592448519_d7ebc2c9-b778-4528-bf69-d8327d07a0fa_small.webp", "category": "effects/depth_intervention", "name": "depth_intervention_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592455412_7bcfaf7d-3522-4dc1-9515-8f3de0253dca_small.webp", "category": "effects/depth_intervention", "name": "depth_intervention_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592472638_f37c6815-340d-4133-b79c-944fc5497b1e_small.webp", "category": "effects/time_manipulation", "name": "time_manipulation_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592464816_fda9c50c-9f5c-419c-8b53-f7eff2d88fcd_small.webp", "category": "effects/time_manipulation", "name": "time_manipulation_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592469910_f2b0c0fb-0dac-4569-ab27-3e29ac81fdf4_small.webp", "category": "effects/time_manipulation", "name": "time_manipulation_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592471873_5d7cd881-96a4-48a3-b83d-6a5d8b389e5f_small.webp", "category": "effects/time_manipulation", "name": "time_manipulation_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592489406_a97ac7dc-9632-45ec-974c-9fe7b1f59e46_small.webp", "category": "effects/verdict", "name": "verdict_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592481032_ebd7db46-b228-4699-801f-b198b319661e_small.webp", "category": "effects/verdict", "name": "verdict_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592476755_9d499045-b66f-48ff-bcb7-dc40f96b6148_small.webp", "category": "effects/verdict", "name": "verdict_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592478707_ed1b0e1f-6121-4766-be98-cdf9ffadf8f2_small.webp", "category": "effects/verdict", "name": "verdict_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592505834_6c2a8e24-7636-48e0-b459-7b7b518895c6_small.webp", "category": "effects/scar", "name": "scar_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592497737_9dd4c6e2-ba13-43c1-b255-c5b943dfff68_small.webp", "category": "effects/scar", "name": "scar_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592510525_73a29ad8-08bc-4545-a8b0-93845de1f2af_small.webp", "category": "effects/scar", "name": "scar_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592496383_339d45c8-a0a7-4788-95d4-c70960f5964e_small.webp", "category": "effects/scar", "name": "scar_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592580446_7559e560-ddf3-4234-803c-3ffa08dcb6b4_small.webp", "category": "effects/drift", "name": "drift_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592584539_97ba0a45-824a-4d34-8bec-41ad11df4c0c_small.webp", "category": "effects/drift", "name": "drift_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592576888_d152208e-2968-46a6-b82e-865654204b48_small.webp", "category": "effects/drift", "name": "drift_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592580627_9f780e62-81ce-4ea4-8f19-4b96f429e530_small.webp", "category": "effects/drift", "name": "drift_4.webp"},
]

# UI图素
UI_ELEMENTS = [
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592903483_0c075ed2-975a-4d69-b9a8-96b7189c61e6_small.webp", "category": "ui/buttons", "name": "primary_btn_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592902375_774ac4cd-189a-4d12-b201-73dc8b654c73_small.webp", "category": "ui/buttons", "name": "primary_btn_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592907695_e45fea78-5ae1-472a-bd41-f744520ac4ae_small.webp", "category": "ui/buttons", "name": "primary_btn_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592908420_ea1a6e0d-91c5-410a-b768-87c7e89d4680_small.webp", "category": "ui/buttons", "name": "primary_btn_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592991300_13a7daae-5247-46d0-bb4f-c8c5bb897ea1_small.webp", "category": "ui/buttons", "name": "secondary_btn_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592982130_20cda516-282a-4e7f-9841-79fc6fb23c0a_small.webp", "category": "ui/buttons", "name": "secondary_btn_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592980496_f6640492-c9bc-45a8-9c16-7b53bbd821c1_small.webp", "category": "ui/buttons", "name": "secondary_btn_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766592993852_7a9def54-2fbe-456e-9528-9fdbd8f69d29_small.webp", "category": "ui/buttons", "name": "secondary_btn_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593050670_9db1e5ce-82e2-4ab4-a100-b4d2f136bde8_small.webp", "category": "ui/icons", "name": "menu_icon_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593043646_a1fed240-b426-4052-81df-f03124e5e3a2_small.webp", "category": "ui/icons", "name": "menu_icon_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593052356_3e41ecf6-af97-48a0-b27a-7b041436e0f8_small.webp", "category": "ui/icons", "name": "menu_icon_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593047029_dd34d8a1-d8fe-475d-8f82-c74f77121cc3_small.webp", "category": "ui/icons", "name": "menu_icon_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593207925_e2c031a6-6f64-4c48-b378-f9b6def03a79_small.webp", "category": "ui/panels", "name": "dialogue_panel_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593206158_bf4556f3-80fd-405c-a661-48f03bb87b99_small.webp", "category": "ui/panels", "name": "dialogue_panel_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593225263_bf5f4b4e-61fe-49b8-8269-cd3f0be50886_small.webp", "category": "ui/panels", "name": "dialogue_panel_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593221243_bd03be96-1f0b-4414-9cd7-ffd7529bc5c1_small.webp", "category": "ui/panels", "name": "dialogue_panel_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593235998_5634efd6-7940-452d-9c35-6f5890351ab0_small.webp", "category": "ui/panels", "name": "card_panel_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593235096_79c356c9-7cd3-4729-a2e9-eb7276340737_small.webp", "category": "ui/panels", "name": "card_panel_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593245422_a37ccb3f-7b30-467e-8e2a-01b92fba7cc9_small.webp", "category": "ui/panels", "name": "card_panel_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593226145_2d690256-4ce7-4fb9-be9a-55bd75531612_small.webp", "category": "ui/panels", "name": "card_panel_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593232300_e57ae2f2-0b95-424d-adda-24230be97d53_small.webp", "category": "ui/bars", "name": "progress_bar_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593236715_1f7c1750-5a18-46c0-a081-e259fc144b7f_small.webp", "category": "ui/bars", "name": "progress_bar_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593234103_a74cb8fe-d872-4922-97ed-7d69cd3368f6_small.webp", "category": "ui/bars", "name": "progress_bar_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593232140_5f40895c-076a-4a06-97b9-2bfa4d2c7e50_small.webp", "category": "ui/bars", "name": "progress_bar_4.webp"},
]


def download_image(url, save_path):
    """下载单张图片"""
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            return True
        else:
            print(f"  Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"  Error: {e}")
        return False


def download_batch(images, batch_name):
    """批量下载图片"""
    print(f"\n=== Downloading {batch_name} ({len(images)} images) ===")
    
    success = 0
    failed = 0
    
    for i, img in enumerate(images, 1):
        # 创建目录
        save_dir = BASE_DIR / img["category"]
        save_dir.mkdir(parents=True, exist_ok=True)
        
        save_path = save_dir / img["name"]
        
        print(f"[{i}/{len(images)}] {img['name']}...", end=" ")
        
        if download_image(img["url"], save_path):
            print("OK")
            success += 1
        else:
            failed += 1
        
        # 短暂延迟避免请求过快
        time.sleep(0.1)
    
    print(f"\n{batch_name}: {success} success, {failed} failed")
    return success, failed


def main():
    print("=" * 60)
    print("Footnote Game Assets Batch Downloader")
    print("=" * 60)
    
    total_success = 0
    total_failed = 0
    
    # 下载场景物件
    s, f = download_batch(ALL_IMAGES, "Scene Objects")
    total_success += s
    total_failed += f
    
    # 下载可动物件动画
    s, f = download_batch(ANIMATED_OBJECTS, "Animated Objects")
    total_success += s
    total_failed += f
    
    # 下载特效
    s, f = download_batch(EFFECTS, "Effects")
    total_success += s
    total_failed += f
    
    # 下载UI图素
    s, f = download_batch(UI_ELEMENTS, "UI Elements")
    total_success += s
    total_failed += f
    
    print("\n" + "=" * 60)
    print(f"TOTAL: {total_success} success, {total_failed} failed")
    print("=" * 60)


if __name__ == "__main__":
    main()

