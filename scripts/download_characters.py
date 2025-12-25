#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载角色精灵和头像图片 - 第1批
"""

import requests
import os
from pathlib import Path
import time

BASE_DIR = Path("F:/workspace/github/Footnote/assets/images/characters")

# 角色精灵和头像
IMAGES = [
    # 岑回角色精灵
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766580028357_8904e62a-05bb-4992-b546-a3ef86c3d074_small.webp", "category": "sprites/cenhui", "name": "cenhui_idle_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766580030897_e4ca0c06-d40b-42ca-b701-c68fa70cd9c4_small.webp", "category": "sprites/cenhui", "name": "cenhui_idle_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766580013985_6d04ddf1-dcc5-4dd0-8a7a-10425467f1f6_small.webp", "category": "sprites/cenhui", "name": "cenhui_idle_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766580013993_25b0f488-821f-4334-b6ef-5829e4d91ecb_small.webp", "category": "sprites/cenhui", "name": "cenhui_idle_4.webp"},
    
    # 顾临角色精灵
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766581473934_3fa6bdda-e8d1-4971-9920-4b39ef1e97ad_small.webp", "category": "sprites/gulin", "name": "gulin_idle_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766581482540_b750dcf4-f125-4d70-adb1-5d3b846098ad_small.webp", "category": "sprites/gulin", "name": "gulin_idle_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766581469403_ef837ee7-e8b1-4a50-b83a-2d22abcef66f_small.webp", "category": "sprites/gulin", "name": "gulin_idle_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766581477094_2fe9b7d9-bd39-496f-b99f-1404ec22df8b_small.webp", "category": "sprites/gulin", "name": "gulin_idle_4.webp"},
    
    # 宋岚角色精灵
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766581606563_c6fcf814-1d4f-4ca5-b94e-f55829b08f6a_small.webp", "category": "sprites/songlan", "name": "songlan_idle_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766581609256_dd159a6d-d3e7-4c39-8e32-c6c0611e2b51_small.webp", "category": "sprites/songlan", "name": "songlan_idle_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766581586555_de1cdf52-e570-4f11-a094-97e4cf299de2_small.webp", "category": "sprites/songlan", "name": "songlan_idle_3.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766581589775_d933ca0f-0d2f-49cd-b357-ab1b63fa5f2d_small.webp", "category": "sprites/songlan", "name": "songlan_idle_4.webp"},
    
    # 岑回头像（多种表情）
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589836224_d876b43e-b656-4e68-8c3b-3ff1f2211ed0_small.webp", "category": "portraits/cenhui", "name": "cenhui_neutral_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589853292_612d9889-9d85-4027-bbd0-9544cc8d2883_small.webp", "category": "portraits/cenhui", "name": "cenhui_neutral_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589844364_a3003bcb-d541-4ee5-badb-1d62d659bb86_small.webp", "category": "portraits/cenhui", "name": "cenhui_sad_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589836461_e19fcbfe-90e6-40c0-b457-9f346d5bb7e3_small.webp", "category": "portraits/cenhui", "name": "cenhui_sad_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589743681_42665b88-2dc0-4c4b-942c-c9d8202cb463_small.webp", "category": "portraits/cenhui", "name": "cenhui_thinking_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589745380_afaaad0c-fc46-413b-a393-7e21ae3d8698_small.webp", "category": "portraits/cenhui", "name": "cenhui_thinking_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589656108_37afdc17-5017-42e4-86b2-e04f40de69e2_small.webp", "category": "portraits/cenhui", "name": "cenhui_angry_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589676289_c539d594-b49c-4a52-8f66-8f7b0bce6f51_small.webp", "category": "portraits/cenhui", "name": "cenhui_angry_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589538143_10e9dd2a-b726-46b7-bc35-de4b83db332f_small.webp", "category": "portraits/cenhui", "name": "cenhui_surprised_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589549680_6cead17f-5586-4fe5-b84a-4da0e9381cf4_small.webp", "category": "portraits/cenhui", "name": "cenhui_surprised_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589428348_9694ef1c-bc50-4421-999e-fc20fd751ac1_small.webp", "category": "portraits/cenhui", "name": "cenhui_smiling_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589433123_547e7af6-f445-4e79-ba42-824a714a779e_small.webp", "category": "portraits/cenhui", "name": "cenhui_smiling_2.webp"},
    
    # 顾临头像
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589981960_9400a9c8-077c-4b1c-a627-9e01c996ede1_small.webp", "category": "portraits/gulin", "name": "gulin_neutral_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766589984843_39921319-b350-4cd4-91a7-8836492082ee_small.webp", "category": "portraits/gulin", "name": "gulin_neutral_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590019701_7e63d279-0bb8-4d33-820d-b16cf12edfbc_small.webp", "category": "portraits/gulin", "name": "gulin_stern_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590022134_f8667cf1-a210-49d3-8284-9baf136149f6_small.webp", "category": "portraits/gulin", "name": "gulin_stern_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590046400_0e1852c0-417a-4997-9285-ef8a444fc77f_small.webp", "category": "portraits/gulin", "name": "gulin_thinking_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590060381_a33c72e2-d203-443f-96f6-24d7dd5c317c_small.webp", "category": "portraits/gulin", "name": "gulin_thinking_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590068751_c01cd570-d8c5-4644-a15f-1edd6d54fe54_small.webp", "category": "portraits/gulin", "name": "gulin_angry_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590082368_d795b275-0085-40bd-991b-01f30a2371ec_small.webp", "category": "portraits/gulin", "name": "gulin_angry_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590092043_73bef6cf-4488-45ce-a5d9-a487aef35438_small.webp", "category": "portraits/gulin", "name": "gulin_tired_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590081536_9701f9eb-a710-4c37-8754-ce3b2dcab8e6_small.webp", "category": "portraits/gulin", "name": "gulin_tired_2.webp"},
    
    # 宋岚头像
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590227268_f978ced0-c131-4f4b-9e58-6dc6d78f017a_small.webp", "category": "portraits/songlan", "name": "songlan_neutral_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590232173_7cdc96b2-7455-45ce-ad33-f52c6f4d2681_small.webp", "category": "portraits/songlan", "name": "songlan_neutral_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590258138_069750d7-47da-4ece-8f88-253f9c8eeff4_small.webp", "category": "portraits/songlan", "name": "songlan_warm_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590257771_9e6bb1d8-0f91-4db6-894c-2b3f2e3d3514_small.webp", "category": "portraits/songlan", "name": "songlan_warm_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590268339_a27ff3cc-edbb-4d1e-af97-9d56bbf33ebf_small.webp", "category": "portraits/songlan", "name": "songlan_worried_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590271289_c0267860-5928-42c0-bb06-d36ea964baaf_small.webp", "category": "portraits/songlan", "name": "songlan_worried_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590279377_24566b6b-164d-4dd5-94aa-26c757353fac_small.webp", "category": "portraits/songlan", "name": "songlan_serious_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590276343_30c0fe71-5a34-4013-b5ad-eb669fbea581_small.webp", "category": "portraits/songlan", "name": "songlan_serious_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590285185_322f1cc3-a7fc-463b-bf9e-5f4c7b11132f_small.webp", "category": "portraits/songlan", "name": "songlan_kind_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590282188_daf70239-2a68-41ff-9193-ca76434812b6_small.webp", "category": "portraits/songlan", "name": "songlan_kind_2.webp"},
    
    # 许澄头像
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590452168_a82df19c-ebfe-45e5-a6bc-57d271cafff3_small.webp", "category": "portraits/xucheng", "name": "xucheng_neutral_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590452374_9e978926-d243-4dd5-bd04-fc448a04d0e6_small.webp", "category": "portraits/xucheng", "name": "xucheng_neutral_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590455513_5b4289ed-f812-4727-87d0-68a5e42a2e15_small.webp", "category": "portraits/xucheng", "name": "xucheng_concerned_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590456477_ccb64fb8-0904-463a-a081-89bb53898e72_small.webp", "category": "portraits/xucheng", "name": "xucheng_concerned_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590460766_d244b274-3db0-4cc1-a226-c310cf05e4cc_small.webp", "category": "portraits/xucheng", "name": "xucheng_professional_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590463831_04fb60df-c1d7-41b1-9934-573198fdc942_small.webp", "category": "portraits/xucheng", "name": "xucheng_professional_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590470159_d3c8e07f-2c2c-41bf-ae8f-422bec55e95b_small.webp", "category": "portraits/xucheng", "name": "xucheng_sad_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590471110_430a51bf-d6ba-4c5f-8795-a246c4bf28bc_small.webp", "category": "portraits/xucheng", "name": "xucheng_sad_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590478762_19b36edd-5e5f-4b5a-9799-fd67a76ee0b7_small.webp", "category": "portraits/xucheng", "name": "xucheng_understanding_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590473339_77ea3263-004b-442f-9203-720aa898e03f_small.webp", "category": "portraits/xucheng", "name": "xucheng_understanding_2.webp"},
    
    # 阿棠头像
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590596354_ee09d49b-408e-4e06-9e8c-30b95399346e_small.webp", "category": "portraits/atang", "name": "atang_neutral_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590599161_917a6b1f-2750-4577-90f6-8fd375a2b0ab_small.webp", "category": "portraits/atang", "name": "atang_neutral_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590607832_7b3f11ed-1c84-4798-9dfa-05d38e9a5b48_small.webp", "category": "portraits/atang", "name": "atang_excited_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590608762_fe7634f9-f94c-48cf-930a-6d20868c4b68_small.webp", "category": "portraits/atang", "name": "atang_excited_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590616274_f7f52091-4aa8-48f5-ba21-d6d483a67581_small.webp", "category": "portraits/atang", "name": "atang_dreamy_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590622983_bb3871f4-e04d-411d-bbdc-ae2d8ec514e2_small.webp", "category": "portraits/atang", "name": "atang_dreamy_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590631926_b68dd05f-67b8-4a70-8f90-96d4cf94313f_small.webp", "category": "portraits/atang", "name": "atang_sad_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590632073_1982f0c4-4e02-47f2-ad6f-b9070ed47ed4_small.webp", "category": "portraits/atang", "name": "atang_sad_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590660324_b3f46e13-8393-4488-ab24-a15b74609348_small.webp", "category": "portraits/atang", "name": "atang_confused_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590634934_f02fb260-984b-457a-927d-2e08539462e2_small.webp", "category": "portraits/atang", "name": "atang_confused_2.webp"},
    
    # 牧平头像
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590803875_601d253e-397c-4363-80cf-7a473bd0d5de_small.webp", "category": "portraits/muping", "name": "muping_neutral_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590807244_e166add8-1a75-49d0-b02b-8e5965880ae9_small.webp", "category": "portraits/muping", "name": "muping_neutral_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590823288_b765cba6-b49d-4bb9-8689-2c709e44adeb_small.webp", "category": "portraits/muping", "name": "muping_serene_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590828232_e75b761e-d81f-48f9-bb7b-0640d8f1aec2_small.webp", "category": "portraits/muping", "name": "muping_serene_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590830071_78b233d3-ecf9-433f-916c-e0276494b8b8_small.webp", "category": "portraits/muping", "name": "muping_wise_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590830402_cd6af943-0edd-4f33-96f8-4da73eec084a_small.webp", "category": "portraits/muping", "name": "muping_wise_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590842166_677ee4e8-6bd2-4404-a682-ca06a56a5d2a_small.webp", "category": "portraits/muping", "name": "muping_sad_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590842469_9195af37-77b3-4362-8f34-7ff0ae768e2c_small.webp", "category": "portraits/muping", "name": "muping_sad_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590852594_0c83c2c1-a31b-4a62-99e6-a8f704538c27_small.webp", "category": "portraits/muping", "name": "muping_mysterious_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590845587_48574fb7-1b22-4461-9c34-35d0e886fedb_small.webp", "category": "portraits/muping", "name": "muping_mysterious_2.webp"},
    
    # 栖蓝头像
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590850948_e47d1743-0770-4655-a174-52a6194f735b_small.webp", "category": "portraits/qilan", "name": "qilan_neutral_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590858896_2bfd9495-d39f-4262-90c7-46bb8feed33a_small.webp", "category": "portraits/qilan", "name": "qilan_neutral_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590862494_edf48c10-a260-4386-a6eb-09fd9ca595bf_small.webp", "category": "portraits/qilan", "name": "qilan_kind_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590862739_5aed160a-508f-46da-8b99-de7d373b49f2_small.webp", "category": "portraits/qilan", "name": "qilan_kind_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590866603_8a53d4a5-77de-4408-af29-1c117bdf43ca_small.webp", "category": "portraits/qilan", "name": "qilan_worried_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590866721_e1c6a400-0124-4f2c-a25c-a4b1845f830b_small.webp", "category": "portraits/qilan", "name": "qilan_worried_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590868388_47bf4f5e-053c-48d5-a847-b59b7b9ba5fc_small.webp", "category": "portraits/qilan", "name": "qilan_smiling_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590868856_f2ae7412-3883-4642-8422-30b45141e9bd_small.webp", "category": "portraits/qilan", "name": "qilan_smiling_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590871022_6de80bd6-c50e-41bf-a9f3-b753d27e47f3_small.webp", "category": "portraits/qilan", "name": "qilan_sad_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590879451_13012d96-c9fe-44f8-874c-38e28cd06f9d_small.webp", "category": "portraits/qilan", "name": "qilan_sad_2.webp"},
    
    # 陈匠头像
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590877017_6321402b-bfe4-49b0-9409-d78303ac095f_small.webp", "category": "portraits/chenjiang", "name": "chenjiang_neutral_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590877743_6b24ae9d-018c-465c-aa67-a192bf8b1c77_small.webp", "category": "portraits/chenjiang", "name": "chenjiang_neutral_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590882718_eb49ed8f-353e-4f57-979a-dd72f2dc66ba_small.webp", "category": "portraits/chenjiang", "name": "chenjiang_hopeful_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590883854_778c3994-73f1-4e63-ac86-be452304c4bc_small.webp", "category": "portraits/chenjiang", "name": "chenjiang_hopeful_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590889873_776bc399-447f-4a2c-80af-38f7d89f50ce_small.webp", "category": "portraits/chenjiang", "name": "chenjiang_tired_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590895673_466d3190-ec59-4956-9ace-25dffda76634_small.webp", "category": "portraits/chenjiang", "name": "chenjiang_tired_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590896400_e7c42042-1257-404b-b1d2-600c00ea8d6a_small.webp", "category": "portraits/chenjiang", "name": "chenjiang_kind_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590897995_dbfad0f3-e20d-41c7-8479-5ee782692a39_small.webp", "category": "portraits/chenjiang", "name": "chenjiang_kind_2.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590911378_e4318478-5c65-4103-8d41-fa2348f3206a_small.webp", "category": "portraits/chenjiang", "name": "chenjiang_focused_1.webp"},
    {"url": "https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766590912089_6a7d07e0-7625-47e2-adf7-dbf72be6672a_small.webp", "category": "portraits/chenjiang", "name": "chenjiang_focused_2.webp"},
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
    print("Downloading Character Sprites and Portraits")
    print("=" * 60)
    
    success = 0
    failed = 0
    
    for i, img in enumerate(IMAGES, 1):
        # 创建目录
        save_dir = BASE_DIR / img["category"]
        save_dir.mkdir(parents=True, exist_ok=True)
        
        save_path = save_dir / img["name"]
        
        print(f"[{i}/{len(IMAGES)}] {img['category']}/{img['name']}...", end=" ")
        
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

