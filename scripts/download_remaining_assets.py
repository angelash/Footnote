# -*- coding: utf-8 -*-
"""下载智绘AI平台上所有剩余的游戏资产"""
import os
import requests
import time

# 确保输出目录存在
dirs = [
    'assets/images/backgrounds/remaining',
    'assets/images/objects/remaining',
    'assets/images/effects/remaining',
    'assets/images/ui/remaining',
    'assets/images/animated/remaining',
    'assets/images/characters/sprites/remaining',
    'assets/images/characters/portraits/remaining',
    'assets/images/other'
]
for d in dirs:
    os.makedirs(d, exist_ok=True)

# 所有689张图片的URL列表（从API获取）
images = [
    # 场景物件和背景 (chatId: 23375)
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594790936_fc6fd21b-1974-4f4a-aa0a-9f353b210b58_small.webp", "objects", "collapsed_ruins_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594805236_fd5c1491-8c11-41c7-b9f8-427657ba056c_small.webp", "objects", "collapsed_ruins_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594797523_cc02944c-e15f-4817-b041-b0a266f635db_small.webp", "objects", "collapsed_ruins_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594810443_1afe9085-3667-48ea-859a-3746be3db8fd_small.webp", "objects", "warning_hazard_sign_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594792511_ae5cde0d-b2b8-4822-91f1-41f994f874f2_small.webp", "objects", "warning_hazard_sign_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594789769_0613057c-ec4a-4c7c-b0db-16d4bac5e5cb_small.webp", "objects", "warning_hazard_sign_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594789832_4778f7e0-c9eb-4358-bc25-d8efedd751ab_small.webp", "objects", "warning_hazard_sign_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594785390_41d6451c-15c7-4ba8-a5fd-bb2f82529091_small.webp", "objects", "distorted_reality_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594786023_86a7c40b-3305-4361-9067-5b94460fd07e_small.webp", "objects", "distorted_reality_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594782638_acf6d9fb-8f69-4b49-811e-8b74377c45d2_small.webp", "objects", "distorted_reality_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594782478_4c31832b-90cb-49f6-85bb-4a173dbf9239_small.webp", "objects", "distorted_reality_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594788346_c87ba63c-4aa2-4677-9bb8-b9b478c993ac_small.webp", "objects", "ritual_bowl_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594777014_8abba701-238c-405e-9590-abf6f734cd7e_small.webp", "objects", "ritual_bowl_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594768017_d412c7b4-0393-48d9-88c9-df170cb10f93_small.webp", "objects", "ritual_bowl_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594759666_fcf42d15-5d54-4f8f-b96e-ed2c5cc42cfe_small.webp", "objects", "rune_stone_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594760619_94ea16fc-2607-4136-b9e1-4af4c455f100_small.webp", "objects", "rune_stone_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594765892_5a708fe0-fd76-4596-a9d2-0385f1f7c958_small.webp", "objects", "rune_stone_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594763207_fe1c89be-610c-433c-b1d5-35b25749006e_small.webp", "objects", "rune_stone_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594765394_4ae9a478-e04e-492b-bc03-26aea30fcea5_small.webp", "objects", "deity_statue_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594768301_d10ae340-1a98-4d66-a824-af708a5b1495_small.webp", "objects", "deity_statue_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594764970_323c33cb-6faf-4092-b382-9ca39329fdec_small.webp", "objects", "deity_statue_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594769090_76ca47ce-b74e-4594-be49-22ccd082412f_small.webp", "objects", "ritual_candle_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594751875_150c7402-edd7-4693-a135-41b16165f4fd_small.webp", "objects", "ritual_candle_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594752962_8fc259f9-66a6-48f6-9791-d5905905f482_small.webp", "objects", "ritual_candle_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594765644_1b5eff6c-730f-4f49-ae65-2bec8aa3ba8f_small.webp", "objects", "ritual_candle_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594745780_53b9a081-2cac-4706-adbb-bf6990e5cdf3_small.webp", "objects", "waiting_chair_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594742860_5792192e-2151-4829-8664-afabb01173b0_small.webp", "objects", "waiting_chair_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594741759_7d66b67e-8af0-4b88-9c87-8fb35a2e3c08_small.webp", "objects", "waiting_chair_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594741496_edb16317-6902-4972-90be-b88911a5131e_small.webp", "objects", "waiting_chair_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594734090_c7ec1bae-e08e-4beb-bc3a-cb51e176e8fe_small.webp", "objects", "medicine_cabinet_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594734966_ecc4bb8f-e505-4b30-88fc-ee921868d045_small.webp", "objects", "medicine_cabinet_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594735967_17bc3132-0908-4cab-9871-68d77a7b8afd_small.webp", "objects", "medicine_cabinet_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594737009_55838248-35fb-4687-aa60-8a70358c582e_small.webp", "objects", "medicine_cabinet_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594738496_2359c3cc-187d-4926-b9f7-54024c62dcf1_small.webp", "objects", "medical_equipment_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594747227_32727620-80c0-4456-8b82-42fef612e9e4_small.webp", "objects", "medical_equipment_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594738471_f56761e7-e6a5-4cef-a9bd-2d6b4607e38f_small.webp", "objects", "medical_equipment_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594751739_96490f78-103c-4c92-b9ae-c71c6940a6cb_small.webp", "objects", "medical_equipment_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594759127_0b5b13d3-4a68-4ce6-85b5-79f31e5c9cb2_small.webp", "objects", "map_scroll_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594716912_09d2d076-5be8-47b2-899f-79996af8c73a_small.webp", "objects", "map_scroll_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594719557_299d4d48-36c3-4c44-9a0a-64a6bd252204_small.webp", "objects", "map_scroll_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594723561_e5199b8a-6de6-40e1-b9d6-167293929da3_small.webp", "objects", "map_scroll_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594716900_4b608973-59ee-4cea-a562-36bf0cfe362b_small.webp", "objects", "book_binding_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594714783_3a164d60-8d21-4d94-b47e-fbf93dedd3a8_small.webp", "objects", "book_binding_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594716150_2e9f2c9e-58a0-4cee-b55f-5eb044fa960d_small.webp", "objects", "book_binding_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594707377_f738b1e2-9d2b-479f-9d3e-66d9fba6afb1_small.webp", "objects", "book_binding_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594707721_c4981419-c335-4ec1-889a-63fb85ccca58_small.webp", "objects", "book_pile_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594702802_d493f06c-ce36-429e-adb4-e54a948080cd_small.webp", "objects", "book_pile_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594699910_f89fc15f-1134-467c-9bc3-f59f84d1867c_small.webp", "objects", "book_pile_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594702606_ceaff85e-d8e1-4a12-8e6c-da34cff4aee5_small.webp", "objects", "book_pile_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594689770_71c978b3-62f5-4a02-95df-08aa9e032116_small.webp", "objects", "signage_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594691380_487a813e-43f4-4249-a7b7-a4046e5099c0_small.webp", "objects", "signage_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594692931_e20e4c8f-e1b3-4947-9abd-f46c7778fd78_small.webp", "objects", "signage_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594689273_2d6b9413-8440-48b7-8fd8-58a66c9386dc_small.webp", "objects", "signage_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594680124_f3ef7fc9-bd2f-4f21-acdc-78977ad3387a_small.webp", "objects", "barrier_fence_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594681833_cd6442db-1198-4526-898b-581ad65259d9_small.webp", "objects", "barrier_fence_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594680037_a319a6b4-d0bd-4076-988b-fa61aad0dbee_small.webp", "objects", "barrier_fence_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594684014_ef5836bd-1233-4699-b605-6c15b51022ae_small.webp", "objects", "barrier_fence_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594680972_97369681-4c70-42eb-a765-b3353f320f40_small.webp", "objects", "monitor_screen_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594682404_93f37ff3-0500-4a10-ba09-2c7fa47346a5_small.webp", "objects", "monitor_screen_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594684166_fd487a33-abd7-460f-a9b1-1df9da59bb03_small.webp", "objects", "monitor_screen_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594754509_ede4544d-9b2a-4e79-9d5f-7906e6e730e9_small.webp", "objects", "monitor_screen_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594666255_b580e4f4-2ace-42f7-a66d-b2c5a7bdab3b_small.webp", "objects", "filing_cabinet_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594670059_6d06bb9d-6686-4b61-9889-9856c8035a5e_small.webp", "objects", "filing_cabinet_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594676745_75f8157e-e071-44fd-b344-7de501114f58_small.webp", "objects", "filing_cabinet_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594666412_60b34978-5916-443d-ba5d-8e80e3002007_small.webp", "objects", "filing_cabinet_4"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594671141_85e98c0c-f335-4ff4-9380-96fbfd69e597_small.webp", "objects", "household_items_1"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594663156_8d856693-b116-4612-bd36-e1972535cc96_small.webp", "objects", "household_items_2"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594663172_d168e38a-a1f3-423b-a564-f034eab9fc70_small.webp", "objects", "household_items_3"),
    ("https://artflow.gz4399.com/cosres/apps-ai-tools/nextimage/storage_out/user_130/1766594665095_36045579-524e-4a27-8d71-a0082d599789_small.webp", "objects", "household_items_4"),
]

# 下载函数
def download_image(url, category, name):
    """下载单张图片"""
    if category == 'objects':
        save_dir = 'assets/images/objects/remaining'
    elif category == 'backgrounds':
        save_dir = 'assets/images/backgrounds/remaining'
    elif category == 'effects':
        save_dir = 'assets/images/effects/remaining'
    elif category == 'ui':
        save_dir = 'assets/images/ui/remaining'
    elif category == 'animated':
        save_dir = 'assets/images/animated/remaining'
    elif category == 'portraits':
        save_dir = 'assets/images/characters/portraits/remaining'
    elif category == 'sprites':
        save_dir = 'assets/images/characters/sprites/remaining'
    else:
        save_dir = 'assets/images/other'
    
    save_path = os.path.join(save_dir, f'{name}.webp')
    
    if os.path.exists(save_path):
        print(f'[SKIP] {name} already exists')
        return True
    
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            print(f'[OK] {name} -> {save_path}')
            return True
        else:
            print(f'[FAIL] {name}: HTTP {response.status_code}')
            return False
    except Exception as e:
        print(f'[ERROR] {name}: {e}')
        return False

# 执行下载
print(f'Starting download of {len(images)} images...')
success = 0
failed = 0

for url, category, name in images:
    if download_image(url, category, name):
        success += 1
    else:
        failed += 1
    time.sleep(0.1)  # 避免请求过快

print(f'\n=== Download Complete ===')
print(f'Success: {success}')
print(f'Failed: {failed}')
print(f'Total: {len(images)}')

