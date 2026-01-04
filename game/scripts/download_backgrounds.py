#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载场景背景图片
"""

import requests
import os
from pathlib import Path
import time

BASE_DIR = Path("F:/workspace/github/Footnote/assets/images/backgrounds")

# 场景背景图片
BACKGROUNDS = [
    # C2场景
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593627240_fc8e8e4c-ef4d-42f4-a936-74f6a26df6ef_small.webp", "category": "c2", "name": "edge_breach_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593620911_8a7eb26e-c8cc-442f-8031-614ec5c0af42_small.webp", "category": "c2", "name": "edge_breach_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593621111_175ac56d-24d3-4c21-9b18-19b11709061f_small.webp", "category": "c2", "name": "edge_breach_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593625007_cd751d02-a15d-4308-9dc9-e30b8306de82_small.webp", "category": "c2", "name": "edge_breach_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593649868_1d42e0d9-4b7a-46a8-a9b5-b1e3727b5458_small.webp", "category": "c2", "name": "clinic_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593645612_0d48069f-a33c-484a-8362-4631b8f2f585_small.webp", "category": "c2", "name": "clinic_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593651541_15f26bf9-b3cb-450d-a476-5c2bed41c90b_small.webp", "category": "c2", "name": "clinic_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593649935_9cdd947c-6ca0-472a-900e-71a47ccc775b_small.webp", "category": "c2", "name": "clinic_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593672358_2ba39dbc-b2c2-4211-9090-3f029af15088_small.webp", "category": "c2", "name": "drifter_zone_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593682240_8badc2b3-481b-48cd-b33f-d028c6637cb9_small.webp", "category": "c2", "name": "drifter_zone_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593679847_7eb70f7d-ec64-4998-8adf-e3a918c74ad6_small.webp", "category": "c2", "name": "drifter_zone_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593669235_82054570-c4df-4528-8653-be50391db9c6_small.webp", "category": "c2", "name": "drifter_zone_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593683792_3973809e-cb7e-45e2-aa85-c52723517787_small.webp", "category": "c2", "name": "altar_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593682498_e593a999-e93c-4d0c-8f4c-beabb00e8769_small.webp", "category": "c2", "name": "altar_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593686160_b20ab152-387f-45b4-ad61-4c15c56409dc_small.webp", "category": "c2", "name": "altar_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593680289_b89053b7-1a7d-4fb6-8ddd-a77b9f555d90_small.webp", "category": "c2", "name": "altar_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593699344_4fa218a3-1c94-4883-b5cc-fd436c770728_small.webp", "category": "c2", "name": "cottage_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593702338_357efef1-5442-46cf-9895-6ca4632f34fe_small.webp", "category": "c2", "name": "cottage_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593696531_9eee3530-5092-4912-8587-6a646578d729_small.webp", "category": "c2", "name": "cottage_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593690197_d9607dfe-7264-4b43-960c-97e70b1a6ed4_small.webp", "category": "c2", "name": "cottage_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593699319_3e3ca9e6-d03c-4416-822d-d1b0dca224f2_small.webp", "category": "c2", "name": "rift_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593711967_fedb7913-0f84-455f-90d8-e2751b75106d_small.webp", "category": "c2", "name": "rift_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593707478_bb0bc942-dafb-4d53-9ac8-10130a4cd25c_small.webp", "category": "c2", "name": "rift_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593701205_af42800f-1220-43c4-8c09-dd775c6c9f4a_small.webp", "category": "c2", "name": "rift_4.webp"},
    
    # C3场景
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593721737_e40fe8d1-1229-49f7-b0c8-e5bdcdd87ae9_small.webp", "category": "c3", "name": "collapse_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593718436_3eaa966f-9b91-4e56-a163-f51734b4ead7_small.webp", "category": "c3", "name": "collapse_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593711412_8495e97e-d96d-4ab5-99f8-b7f87b09f9c1_small.webp", "category": "c3", "name": "collapse_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593709803_eef9bb9c-3cab-4742-8f31-25f868805249_small.webp", "category": "c3", "name": "collapse_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593721246_9d2b6e34-89cb-4ca6-9ee2-c4c1e408b114_small.webp", "category": "c3", "name": "intervention_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593727467_d2942554-77a2-476c-906a-a975a2867483_small.webp", "category": "c3", "name": "intervention_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593722574_ddb8b87d-ff10-409f-90ae-ce2a5e60d35f_small.webp", "category": "c3", "name": "intervention_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593730878_a2fd52f7-905c-40a9-8594-c6b0b8e02511_small.webp", "category": "c3", "name": "intervention_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593741085_bd3fb184-5e91-44b6-89b1-05a19ddaf401_small.webp", "category": "c3", "name": "drift_trail_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593735305_a091fd76-c27f-42e5-96e1-cdb3d58ce857_small.webp", "category": "c3", "name": "drift_trail_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593726365_e624dbe0-8101-40f0-8ae3-bf28f4d9fce5_small.webp", "category": "c3", "name": "drift_trail_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593734518_da7f118d-7001-4783-95ef-47be33136425_small.webp", "category": "c3", "name": "drift_trail_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593749047_68fb97f4-8281-450a-8f5f-2ba7a9aa8345_small.webp", "category": "c3", "name": "version_conflict_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593751285_6dbbe0d6-ec5a-4949-be01-2007b7d2fa23_small.webp", "category": "c3", "name": "version_conflict_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593742866_53dc6094-6e64-49bf-99bf-f445a58812dd_small.webp", "category": "c3", "name": "version_conflict_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593762428_ba7ab695-81c5-4027-8a7e-e8c68dca3269_small.webp", "category": "c3", "name": "version_conflict_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593748124_e936196e-ed98-48a2-b225-a0726219d7cb_small.webp", "category": "c3", "name": "lighthouse_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593747407_9a6d95e3-b2b8-49bc-bcbc-dec432a32f0b_small.webp", "category": "c3", "name": "lighthouse_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593751107_e8f18135-3782-4b8f-96c6-496df74b3162_small.webp", "category": "c3", "name": "lighthouse_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593766276_5d118ce5-9fd2-49cd-b800-a52c58542989_small.webp", "category": "c3", "name": "lighthouse_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593764057_369e0ce7-1322-402c-96e2-4d1a586eb3b7_small.webp", "category": "c3", "name": "server_room_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593759951_491daeff-a95f-4710-886e-151b075099a2_small.webp", "category": "c3", "name": "server_room_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593759494_61ea6e36-e7a5-4135-ab93-51541de80177_small.webp", "category": "c3", "name": "server_room_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593763897_fe3cbd44-dc2f-48e2-a177-b431f3fbde87_small.webp", "category": "c3", "name": "server_room_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593773323_ef5ac222-7bfe-43fc-a77b-d70ce5842b16_small.webp", "category": "c3", "name": "rescue_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593769043_babd204a-e104-4b1d-b989-bcca435f741b_small.webp", "category": "c3", "name": "rescue_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593771289_c019ad76-37aa-4403-ae33-733684fca036_small.webp", "category": "c3", "name": "rescue_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593780293_dc2503a3-1ad5-4cd9-8f86-008924f1cdf4_small.webp", "category": "c3", "name": "rescue_4.webp"},
    
    # C4场景
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593780050_418a9e95-f3ef-4738-a35b-cee72b56d85c_small.webp", "category": "c4", "name": "time_training_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593778540_911a7efc-2726-43de-baf5-2d6ce93d0919_small.webp", "category": "c4", "name": "time_training_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593778599_15668268-477d-4ac0-82df-74e121ac5458_small.webp", "category": "c4", "name": "time_training_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593787785_c758041d-c9ff-4a48-a813-894b0e8b8073_small.webp", "category": "c4", "name": "time_training_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593799632_c75de6c6-7a67-40e2-a36a-4d0a98d193b5_small.webp", "category": "c4", "name": "ledger_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593799805_14206329-3f5b-4c60-ad64-374ce5387064_small.webp", "category": "c4", "name": "ledger_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593793049_68993756-cd4f-4104-875d-f9e6d757db14_small.webp", "category": "c4", "name": "ledger_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593793249_64ac7250-91cc-4554-b070-0b00e078f9a4_small.webp", "category": "c4", "name": "ledger_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593801768_d8ff48fe-ee62-4515-bae8-c06f4466a4e9_small.webp", "category": "c4", "name": "time_pollution_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593800575_d3512815-6831-409a-baac-b1383a28ed54_small.webp", "category": "c4", "name": "time_pollution_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593806432_881a84c6-1ef7-433a-8d29-feaee09d4d89_small.webp", "category": "c4", "name": "time_pollution_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593801436_ddf08297-346f-4d48-9cdd-7bb7ea9be663_small.webp", "category": "c4", "name": "time_pollution_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593829886_4c1d5a28-a79e-4f30-9974-801d64253802_small.webp", "category": "c4", "name": "permission_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593817628_757995e9-4305-4a01-b339-910247d19cd7_small.webp", "category": "c4", "name": "permission_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593807838_5c6bf8ba-8b33-44f2-b326-1909c9ea231d_small.webp", "category": "c4", "name": "permission_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593804664_862d3bb5-a974-4bca-8427-32023ea0605c_small.webp", "category": "c4", "name": "permission_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593821359_952fcc10-4532-4eb0-adc8-1bb6f3f70f3a_small.webp", "category": "c4", "name": "version_archive_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593821857_aa69e2ab-c046-47f8-a642-6c91a6a8d51c_small.webp", "category": "c4", "name": "version_archive_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593833361_c87514b3-3364-4b93-87c6-f0314c037213_small.webp", "category": "c4", "name": "version_archive_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593822341_accc293b-efbd-49e8-8389-9973340b166d_small.webp", "category": "c4", "name": "version_archive_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593835591_c065238b-ae16-42ab-a7c4-ebf8eeba1249_small.webp", "category": "c4", "name": "rewind_fail_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593836412_8cb8a2e4-2a68-4b00-8583-7c4545d7189d_small.webp", "category": "c4", "name": "rewind_fail_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593832549_5e01c893-cdd8-4f2b-a8b5-9410a99efb7c_small.webp", "category": "c4", "name": "rewind_fail_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593835585_9b21b0b3-7f29-44dc-9af2-f384b7fc3670_small.webp", "category": "c4", "name": "rewind_fail_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593839949_8ea0a508-60e5-437c-aeb3-e23668131715_small.webp", "category": "c4", "name": "myth_echo_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593846857_b7a52b00-c13f-4333-a66a-6198afe096a7_small.webp", "category": "c4", "name": "myth_echo_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593842238_1f4ed7f3-d48c-4e83-b49d-d249b914c5a3_small.webp", "category": "c4", "name": "myth_echo_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593847110_e304e2de-610d-4984-92c2-053aafcc3c4c_small.webp", "category": "c4", "name": "myth_echo_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593851877_64f63fa4-41fb-4f03-9ec8-b2c2ffbda79e_small.webp", "category": "c4", "name": "patch_boundary_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593847905_81f6fe77-f57d-466b-8ec3-3cf3082c96e5_small.webp", "category": "c4", "name": "patch_boundary_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593849605_edbfb6b7-8669-4ccc-9dc3-c5cd83854364_small.webp", "category": "c4", "name": "patch_boundary_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766593855060_15bba49b-c761-4c52-a570-4e60ae762b92_small.webp", "category": "c4", "name": "patch_boundary_4.webp"},
    
    # C5场景
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594004695_7e8f3cce-2152-459d-9280-978e4aef7211_small.webp", "category": "c5", "name": "non_convergent_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594013824_11098c89-7834-4c45-86e9-39a2c9c4de40_small.webp", "category": "c5", "name": "non_convergent_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594006376_75d0e623-4ab9-477b-a684-923746758e24_small.webp", "category": "c5", "name": "non_convergent_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594018144_d704bc0b-8fa6-44bf-877f-23d34bcc6a90_small.webp", "category": "c5", "name": "non_convergent_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594173796_ae5608cd-5ae5-440b-ad33-7d7d62ea1230_small.webp", "category": "c5", "name": "judgment_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594160443_8c06cec2-3ba3-4166-9170-e9060f3d7e1a_small.webp", "category": "c5", "name": "judgment_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594162086_97bbd082-eb8b-4105-bf2d-3467e138ebe3_small.webp", "category": "c5", "name": "judgment_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594160654_238feffd-d844-4253-a8c7-ca40d86b2949_small.webp", "category": "c5", "name": "judgment_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594168673_9e8d2829-668f-40be-ba42-74858128b7f9_small.webp", "category": "c5", "name": "damaged_cottage_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594179179_fe524c4e-1669-47f7-8e21-16e5c76f108d_small.webp", "category": "c5", "name": "damaged_cottage_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594179906_fdc61883-c9e8-4e17-a914-abcb995d60f9_small.webp", "category": "c5", "name": "damaged_cottage_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594179231_b6a78135-29a0-413d-82ed-6c9d6dd9ade3_small.webp", "category": "c5", "name": "damaged_cottage_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594195833_05cfcf55-fc83-4de5-b565-76ce23ed571f_small.webp", "category": "c5", "name": "stutter_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594187091_11d27c2e-3c4e-4714-a6ec-f3092434f9ae_small.webp", "category": "c5", "name": "stutter_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594190284_a6d450ab-9148-4718-b701-b423abe3dabb_small.webp", "category": "c5", "name": "stutter_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594195954_4540436a-cd5a-432a-a1e1-faa283cd1791_small.webp", "category": "c5", "name": "stutter_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594191070_f8328c02-4300-4193-8f92-e938426e457e_small.webp", "category": "c5", "name": "residue_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594195773_0b481885-9eaf-4edb-9ce6-16ef01f51389_small.webp", "category": "c5", "name": "residue_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594195648_12307278-2efe-4d8d-8aaf-433031ad1b25_small.webp", "category": "c5", "name": "residue_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594193742_875b75b9-ab32-4d80-98f6-9b87f82e902a_small.webp", "category": "c5", "name": "residue_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594203936_a65e44c2-2358-4cd5-b730-75a8e1cdfa53_small.webp", "category": "c5", "name": "museum_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594211416_121061a9-d223-4b07-90fd-5ae8a3d5fdef_small.webp", "category": "c5", "name": "museum_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594204195_90921e20-b10c-4547-93d1-b50900e80905_small.webp", "category": "c5", "name": "museum_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594218312_6884c043-7be8-4fc0-afab-6158c826b369_small.webp", "category": "c5", "name": "museum_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594224024_029f8bee-c708-4f65-b7ba-22d84c844117_small.webp", "category": "c5", "name": "model_boundary_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594209317_759a077b-f6df-468a-a70a-179419d8b2a8_small.webp", "category": "c5", "name": "model_boundary_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594219543_a6528c30-d1d5-4fde-95bc-919117740239_small.webp", "category": "c5", "name": "model_boundary_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594220728_848648f2-936e-4d41-9cf6-42938269c58e_small.webp", "category": "c5", "name": "model_boundary_4.webp"},
    
    # 终章场景
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594229543_9fbec89d-b390-4e03-b0bc-1fc3c0b59291_small.webp", "category": "cf", "name": "viewing_space_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594217840_a1e07756-2490-4178-b5c6-811a4ac3b4fd_small.webp", "category": "cf", "name": "viewing_space_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594226087_53f6bfda-6f99-4ad4-b4a1-d8bd346a13f1_small.webp", "category": "cf", "name": "viewing_space_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594224982_9d168787-e9fd-4886-b4ac-0d766eb58cd8_small.webp", "category": "cf", "name": "viewing_space_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594229255_aa8901d8-434b-4dd6-b462-511d810b7862_small.webp", "category": "cf", "name": "field_accept_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594231223_488a7489-6d33-469e-b76e-82a8754f17bd_small.webp", "category": "cf", "name": "field_accept_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594231254_cc07265b-0b3b-4d15-9b15-86f3a1121730_small.webp", "category": "cf", "name": "field_accept_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594230974_1c3ab18f-9f3b-43b7-b626-620b010229c4_small.webp", "category": "cf", "name": "field_accept_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594245596_3f9ef97a-1a99-4000-b57b-9e6e385b1d5c_small.webp", "category": "cf", "name": "ending_a_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594243223_e3b05f13-9a56-43e1-8375-dfd0e46e2e21_small.webp", "category": "cf", "name": "ending_a_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594243599_6786f4c2-5203-4372-9d1d-17693108b6fc_small.webp", "category": "cf", "name": "ending_a_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594240701_db9191b6-3a7e-4c36-bbad-834df8d73e6e_small.webp", "category": "cf", "name": "ending_a_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594249860_c6a59a29-7c87-4a2e-9b62-20ccfaa32156_small.webp", "category": "cf", "name": "ending_b_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594249484_d4c2df13-3b3b-439b-8552-f8759064a4df_small.webp", "category": "cf", "name": "ending_b_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594252360_26f65b09-c768-4f2b-b1bb-71bb938204e3_small.webp", "category": "cf", "name": "ending_b_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594264759_291f4186-a64f-48bc-b0c6-3e3ccc73aa72_small.webp", "category": "cf", "name": "ending_b_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594281295_444469b3-8e25-40f1-905f-0dfa543d44e7_small.webp", "category": "cf", "name": "ending_c_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594276069_f8be5069-0563-4336-80ef-83f59ab8e1f7_small.webp", "category": "cf", "name": "ending_c_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594267223_bd723c9e-f2f0-4516-bf78-fdf364c6299f_small.webp", "category": "cf", "name": "ending_c_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594270761_0fdf2cb6-0ebe-403c-86f0-826329f5f0a7_small.webp", "category": "cf", "name": "ending_c_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594275404_3670e8bd-2c26-4c55-b40f-34e7da854674_small.webp", "category": "cf", "name": "epilogue_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594269564_591d1a38-586e-4630-9c29-8c550f8dc87d_small.webp", "category": "cf", "name": "epilogue_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594285366_765919c4-9754-45d2-af41-9a87aa8ff6b7_small.webp", "category": "cf", "name": "epilogue_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594274622_c79696db-c19b-405c-88f8-4fd9454f5e5a_small.webp", "category": "cf", "name": "epilogue_4.webp"},
    
    # 重返变体
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594419203_ebbd0243-d1e0-4deb-8309-331bc39925b1_small.webp", "category": "variants", "name": "dormitory_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594421466_7bd76882-f35e-404c-bf19-5054b6e14e22_small.webp", "category": "variants", "name": "dormitory_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594420219_3dcb1136-8768-4258-a36c-2379f2ebd37e_small.webp", "category": "variants", "name": "dormitory_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594434072_b955bbb5-ccf5-4333-b9f4-bfbc1616400b_small.webp", "category": "variants", "name": "dormitory_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594438301_4df4540e-8b5e-4903-976d-490ce62339d8_small.webp", "category": "variants", "name": "thin_wall_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594424988_9d382eab-65ab-4a64-b0bb-cd90ff0a1545_small.webp", "category": "variants", "name": "thin_wall_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594429536_efc3bc3a-725e-4e5c-a274-3f7b1dce4018_small.webp", "category": "variants", "name": "thin_wall_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594429463_0b3aa0a9-4d78-4056-b949-d94881268d68_small.webp", "category": "variants", "name": "thin_wall_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594440665_63d833c3-f25d-4129-bf89-609f516a2801_small.webp", "category": "variants", "name": "archive_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594439583_d70b8ac5-2c7d-437f-bd8f-1d6c3c8281ba_small.webp", "category": "variants", "name": "archive_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594449547_1f415efc-034a-40dc-9f26-3adfbfffbda9_small.webp", "category": "variants", "name": "archive_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594454074_5c2398fa-3978-4e6a-b974-4278c5e174d7_small.webp", "category": "variants", "name": "archive_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594454674_a0b855fe-3769-4010-8b9d-0ecadb89a8dd_small.webp", "category": "variants", "name": "clinic_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594456242_4ef1feea-a724-420b-8a6d-7acc0d124b5e_small.webp", "category": "variants", "name": "clinic_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594459318_21c90986-1c8b-47ea-ac00-d0b9881d1601_small.webp", "category": "variants", "name": "clinic_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594453389_d5a61613-3462-4723-80f2-cc7c17a8008f_small.webp", "category": "variants", "name": "clinic_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594456537_175f6346-0154-4ae0-ac43-ba1dc9d79cc7_small.webp", "category": "variants", "name": "temple_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594462629_e5efa0fe-be50-4e5c-a7dc-c38261cac247_small.webp", "category": "variants", "name": "temple_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594459353_e9e22385-7612-4d81-be5b-9195e0a046ff_small.webp", "category": "variants", "name": "temple_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594462860_778d2a9f-0a69-4206-b17a-4cfe4cd56bf4_small.webp", "category": "variants", "name": "temple_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594470793_6d7db252-d9d1-485b-ba1e-a2f3e5a61541_small.webp", "category": "variants", "name": "qilan_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594466606_800c320a-4287-4487-a081-bcaa71ad2233_small.webp", "category": "variants", "name": "qilan_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594459484_3c72d7c6-0065-4981-9fd6-5fbe4be6f853_small.webp", "category": "variants", "name": "qilan_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594467206_bb21b2e2-d893-476f-a2df-4c0253b00069_small.webp", "category": "variants", "name": "qilan_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594470931_6c952b0c-4fa0-4942-901f-aeba26387ca9_small.webp", "category": "variants", "name": "nonexistent_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594479107_554ab9f7-4dc8-4dc3-8f2b-c4d86c56f3de_small.webp", "category": "variants", "name": "nonexistent_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594472544_f5f72155-5c0b-43ca-9b39-887a174f21a7_small.webp", "category": "variants", "name": "nonexistent_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594482266_957f232f-adb7-4ccc-b417-b750db6983fb_small.webp", "category": "variants", "name": "nonexistent_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594487839_d0ebf106-6cfc-42b8-8297-9bc13a9246b5_small.webp", "category": "variants", "name": "audit_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594484176_6656dc28-01f1-49ac-9bdf-97446e6371ad_small.webp", "category": "variants", "name": "audit_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594488037_39a7b1fa-5d76-4c94-a989-9d4ec46dbc61_small.webp", "category": "variants", "name": "audit_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594477623_62c33543-f0bc-43d4-b242-6ce98171903b_small.webp", "category": "variants", "name": "audit_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594490182_cc875e2b-0d83-4468-bfb1-11bd3246dfcf_small.webp", "category": "variants", "name": "gulin_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594494168_a7958289-cf1b-4992-ae7c-7466a49ac391_small.webp", "category": "variants", "name": "gulin_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594493763_f645ac6e-65ea-4391-a831-a7d68a43f32d_small.webp", "category": "variants", "name": "gulin_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594493510_6facebef-baf8-4698-b86b-c2fbb281b10b_small.webp", "category": "variants", "name": "gulin_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594502132_58d4e46d-7cf2-4b96-8a1c-157460183be5_small.webp", "category": "variants", "name": "songlan_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594509173_f676087b-bc7f-4a79-9e3a-d4e3fb737a6d_small.webp", "category": "variants", "name": "songlan_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594508075_3fac1b9f-8f39-4c3b-808c-60da63069703_small.webp", "category": "variants", "name": "songlan_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594511728_1d6f50fe-a184-483a-9215-4e62ca846898_small.webp", "category": "variants", "name": "songlan_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594510361_363c2e6c-be5f-4e79-8c9e-f37e2c59500b_small.webp", "category": "variants", "name": "xucheng_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594501253_6a795d99-d152-433d-9b38-96790a61c9a5_small.webp", "category": "variants", "name": "xucheng_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594514499_f705da2d-8be8-46b3-9ff7-5b23b262431d_small.webp", "category": "variants", "name": "xucheng_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594502843_cdb6c341-aa35-4650-8734-5cc9637ccbd1_small.webp", "category": "variants", "name": "xucheng_variant_4.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594514283_3dce77fe-2376-40e3-9988-db60873c6e2b_small.webp", "category": "variants", "name": "atang_variant_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594508829_142eee07-c5e0-4189-b5a2-6d65a81039a4_small.webp", "category": "variants", "name": "atang_variant_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594514517_df4f8d13-8a98-45ae-a31e-50c94658a4a3_small.webp", "category": "variants", "name": "atang_variant_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594518080_f28b14b5-7444-491d-b10e-b75e80cedac6_small.webp", "category": "variants", "name": "atang_variant_4.webp"},
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


def main():
    print("=" * 60)
    print("Downloading Scene Backgrounds")
    print("=" * 60)
    
    success = 0
    failed = 0
    
    for i, img in enumerate(BACKGROUNDS, 1):
        # 创建目录
        save_dir = BASE_DIR / img["category"]
        save_dir.mkdir(parents=True, exist_ok=True)
        
        save_path = save_dir / img["name"]
        
        print(f"[{i}/{len(BACKGROUNDS)}] {img['category']}/{img['name']}...", end=" ")
        
        if download_image(img["url"], save_path):
            print("OK")
            success += 1
        else:
            failed += 1
        
        time.sleep(0.1)
    
    print("\n" + "=" * 60)
    print(f"TOTAL: {success} success, {failed} failed")
    print("=" * 60)


if __name__ == "__main__":
    main()

