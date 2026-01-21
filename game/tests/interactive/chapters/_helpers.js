// ============================================================================
// Footnote ChromeMCP 测试辅助函数库
// ============================================================================
// 被各章节测试文件共享使用
// 使用 window.__DEBUG__ 接口访问游戏状态
// ============================================================================

/**
 * 获取游戏实例
 */
function getGame() {
  return window.__GAME__ || window.__PHASER_GAME__ || window.game;
}

/**
 * 获取当前场景
 */
function getScene(sceneName = 'GameScene') {
  const game = getGame();
  return game?.scene?.getScene(sceneName);
}

/**
 * 获取 DEBUG 接口
 */
function getDebug() {
  return window.__DEBUG__ || window.__FOOTNOTE_DEBUG__?.commands;
}

/**
 * 传送到指定 Zone
 */
function teleport(zoneId) {
  const debug = getDebug();
  if (debug?.teleport) {
    const result = debug.teleport(zoneId);
    return { success: result.success, zoneId, message: result.message };
  }
  const game = getGame();
  if (game) {
    game.scene.start('GameScene', { zoneId });
    return { success: true, zoneId };
  }
  return { success: false, error: 'Cannot teleport' };
}

/**
 * 等待函数
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取当前游戏状态（使用 DEBUG API）
 */
function getGameState() {
  const debug = getDebug();
  if (debug?.getGameState) {
    const state = debug.getGameState();
    return {
      currentZone: state.currentZone || getScene()?._currentZoneId,
      R: state.counters?.R ?? 0,
      P: state.counters?.P ?? 0,
      W: state.counters?.W ?? 100,
      flags: state.flags ?? {},
      cards: state.cards ?? [],
      abilities: state.abilities ?? [],
      scars: state.scars ?? [],
      contaminations: state.contaminations ?? []
    };
  }
  // 降级方案：返回默认值
  return {
    currentZone: getScene()?._currentZoneId,
    R: 0, P: 0, W: 100,
    flags: {}, cards: [], abilities: []
  };
}

/**
 * 设置 FLAG
 */
function setFlag(flagName, value = true) {
  const debug = getDebug();
  if (debug?.setFlag) {
    const result = debug.setFlag(flagName, value);
    return { success: result.success, flag: flagName, value };
  }
  return { success: false, error: 'DEBUG not available' };
}

/**
 * 检查 FLAG
 */
function hasFlag(flagName) {
  const debug = getDebug();
  if (debug?.getFlag) {
    return debug.getFlag(flagName) === true;
  }
  return false;
}

/**
 * 设置 R 值
 */
function setR(value) {
  const debug = getDebug();
  if (debug?.setR) {
    const result = debug.setR(value);
    return { success: result.success, R: value };
  }
  return { success: false };
}

/**
 * 设置 P 值
 */
function setP(value) {
  const debug = getDebug();
  if (debug?.setP) {
    const result = debug.setP(value);
    return { success: result.success, P: value };
  }
  return { success: false };
}

/**
 * 增加 R 值
 */
function addR(delta) {
  const debug = getDebug();
  if (debug?.addR) {
    const result = debug.addR(delta);
    return { success: result.success, delta };
  }
  return { success: false };
}

/**
 * 增加 P 值
 */
function addP(delta) {
  const debug = getDebug();
  if (debug?.addP) {
    const result = debug.addP(delta);
    return { success: result.success, delta };
  }
  return { success: false };
}

/**
 * 获取计数器
 */
function getCounter(name) {
  const state = getGameState();
  return state[name] ?? 0;
}

/**
 * 移动玩家到对象位置（使用对象名称而非 ID）
 */
function moveToObject(objectName) {
  const scene = getScene();
  // 优先使用 name 匹配，其次用 id
  const obj = scene?._assembledScene?.objects?.find(
    o => o.name === objectName || o.id === objectName
  );
  if (obj && scene?._player) {
    scene._player.setPosition(obj.x, obj.y - 50);
    return { success: true, objectName, position: { x: obj.x, y: obj.y } };
  }
  return { success: false, error: `Object ${objectName} not found` };
}

/**
 * 查找场景中的对象
 */
function findObject(objectName) {
  const scene = getScene();
  return scene?._assembledScene?.objects?.find(
    o => o.name === objectName || o.id === objectName
  );
}

/**
 * 获取所有可交互对象
 */
function getAllObjects() {
  const scene = getScene();
  return scene?._assembledScene?.objects?.map(o => ({
    name: o.name,
    id: o.id,
    x: o.x,
    y: o.y,
    actionType: o.getData?.('action')?.type
  })) ?? [];
}

/**
 * 触发交互
 */
function interact() {
  const scene = getScene();
  if (scene?._tryInteract) {
    scene._tryInteract();
    return { success: true };
  }
  return { success: false };
}

/**
 * 推进对话（点击继续）
 * 完成打字机效果后推进到下一行
 */
function advanceDialogue() {
  const scene = getScene();
  const ui = scene?._dialogueUI;
  if (ui) {
    // 先完成打字机效果
    if (ui._completeTypewriter) {
      ui._completeTypewriter();
    }
    // 然后推进对话
    if (ui.advance) {
      ui.advance();
      return { success: true };
    }
  }
  return { success: false };
}

/**
 * 完成整个对话（自动推进直到结束）
 * @param maxLines 最大行数限制，防止无限循环
 */
async function completeDialogue(maxLines = 20) {
  const scene = getScene();
  const ui = scene?._dialogueUI;
  if (!ui) return { success: false, error: 'DialogueUI not found' };

  let linesAdvanced = 0;
  
  for (let i = 0; i < maxLines; i++) {
    // 等待一小段时间让 UI 更新
    await wait(200);
    
    // 检查对话是否还在显示
    if (!ui._container?.visible || !ui.isVisible?.()) {
      break;
    }
    
    // 完成打字机并推进
    if (ui._completeTypewriter) {
      ui._completeTypewriter();
    }
    await wait(100);
    
    if (ui.advance) {
      ui.advance();
      linesAdvanced++;
    }
    
    await wait(300);
  }
  
  return { success: true, linesAdvanced };
}

/**
 * 选择对话选项
 */
function selectChoice(choiceIndex) {
  const scene = getScene();
  const dialogueUI = scene?._dialogueUI;
  if (dialogueUI?._selectChoice) {
    dialogueUI._selectChoice(choiceIndex);
    return { success: true, choiceIndex };
  }
  return { success: false };
}

/**
 * 完成打字机效果
 */
function completeTypewriter() {
  const scene = getScene();
  const dialogueUI = scene?._dialogueUI;
  if (dialogueUI?._completeTypewriter) {
    dialogueUI._completeTypewriter();
    return { success: true };
  }
  return { success: false };
}

/**
 * 关闭对话框
 */
function closeDialogue() {
  const scene = getScene();
  if (scene?._dialogueUI?.hideDialogue) {
    scene._dialogueUI.hideDialogue();
    return { success: true };
  }
  return { success: false };
}

/**
 * 关闭卡片 UI
 */
function closeCard() {
  const scene = getScene();
  if (scene?._cardUI?.closeCard) {
    scene._cardUI.closeCard();
    return { success: true };
  }
  return { success: false };
}

/**
 * 检查对话是否正在显示
 */
function isDialogueActive() {
  const scene = getScene();
  return scene?._dialogueUI?._isActive === true;
}

/**
 * 获取当前对话选项
 */
function getDialogueChoices() {
  const scene = getScene();
  return scene?._dialogueUI?._currentChoices ?? [];
}

/**
 * 长按交互（用于触发特殊效果）
 */
async function longPressInteract(duration = 1000) {
  const scene = getScene();
  if (scene?._handleLongPress) {
    scene._handleLongPress();
    await wait(duration);
    scene._handleLongPressRelease?.();
    return { success: true, duration };
  }
  return { success: false };
}

/**
 * 激活能力
 */
function activateAbility(abilityName) {
  const scene = getScene();
  if (scene?._activateAbility) {
    scene._activateAbility(abilityName);
    return { success: true, ability: abilityName };
  }
  return { success: false };
}

/**
 * 解锁能力
 */
function unlockAbility(abilityType) {
  const debug = getDebug();
  if (debug?.unlockAbility) {
    const result = debug.unlockAbility(abilityType);
    return { success: result.success, ability: abilityType };
  }
  return { success: false };
}

/**
 * 检查能力是否已解锁
 */
function hasAbility(abilityName) {
  const state = getGameState();
  return state.abilities?.includes(abilityName) ?? false;
}

/**
 * 获得卡片
 */
function obtainCard(cardId) {
  const debug = getDebug();
  if (debug?.obtainCard) {
    const result = debug.obtainCard(cardId);
    return { success: result.success, cardId };
  }
  return { success: false };
}

/**
 * 检查是否拥有卡片
 */
function hasCard(cardId) {
  const state = getGameState();
  const cards = state.cards ?? [];
  return cards.some(c => c.id === cardId || c === cardId);
}

/**
 * 重置游戏状态（测试前）
 */
function resetGameState() {
  const debug = getDebug();
  if (debug?.reset) {
    const result = debug.reset();
    return { success: result.success };
  }
  return { success: false };
}

/**
 * 设置结局条件
 */
function setupEnding(ending) {
  const debug = getDebug();
  if (debug?.setupEnding) {
    const result = debug.setupEnding(ending);
    return { success: result.success, ending };
  }
  return { success: false };
}

/**
 * 跳转到章节起点
 */
function gotoChapter(chapter) {
  const debug = getDebug();
  if (debug?.gotoChapter) {
    const result = debug.gotoChapter(chapter);
    return { success: result.success, chapter };
  }
  return { success: false };
}

// ============================================================================
// 测试执行器
// ============================================================================

/**
 * 执行单个测试用例
 */
async function executeTest(test, options = {}) {
  const { dryRun = false, verbose = true, timeout = 30000 } = options;
  const result = {
    id: test.id,
    name: test.name,
    zoneId: test.zoneId,
    status: 'pending',
    startTime: Date.now(),
    steps: [],
    verifications: []
  };

  try {
    // 1. 设置游戏状态（如果指定）
    if (test.gameState) {
      if (test.gameState.R !== undefined) setR(test.gameState.R);
      if (test.gameState.P !== undefined) setP(test.gameState.P);
      result.steps.push({ action: 'setupGameState', state: test.gameState });
      await wait(200);
    }

    // 2. 检查前置条件
    if (test.preconditions?.length > 0) {
      for (const cond of test.preconditions) {
        const match = cond.match(/^(\w+)\s*=\s*(true|false)$/i);
        if (match) {
          const [, flagName, value] = match;
          const expected = value.toLowerCase() === 'true';
          const actual = hasFlag(flagName);
          if (actual !== expected) {
            if (options.setupPreconditions !== false) {
              setFlag(flagName, expected);
              result.steps.push({ action: 'setupPrecondition', flag: flagName, value: expected });
            } else {
              result.status = 'skipped';
              result.reason = `Precondition not met: ${cond}`;
              return result;
            }
          }
        } else {
          const actual = hasFlag(cond);
          if (!actual && options.setupPreconditions !== false) {
            setFlag(cond, true);
            result.steps.push({ action: 'setupPrecondition', flag: cond, value: true });
          }
        }
      }
    }

    if (dryRun) {
      result.status = 'dry-run';
      return result;
    }

    // 3. 获取初始状态
    const initialState = getGameState();
    result.initialState = {
      R: initialState.R,
      P: initialState.P,
      W: initialState.W,
      cardsCount: initialState.cards.length,
      flagsCount: Object.keys(initialState.flags).length
    };

    // 4. 执行测试步骤
    if (test.steps?.length > 0) {
      for (const step of test.steps) {
        const stepResult = await executeStep(step);
        result.steps.push(stepResult);
        if (!stepResult.success) {
          result.status = 'failed';
          result.reason = `Step failed: ${step.action}`;
          return result;
        }
      }
    } else {
      // 默认步骤：移动到对象并交互
      const moveResult = moveToObject(test.objectId);
      result.steps.push({ action: 'moveToObject', result: moveResult });
      
      await wait(500);
      
      const interactResult = interact();
      result.steps.push({ action: 'interact', result: interactResult });
      
      await wait(1000);

      // 处理对话选择（如果有分支）
      if (test.branch) {
        completeTypewriter();
        await wait(300);
        
        const choices = getDialogueChoices();
        const choiceIndex = choices.findIndex(c => c.text?.includes(test.branch));
        if (choiceIndex >= 0) {
          selectChoice(choiceIndex);
          result.steps.push({ action: 'selectChoice', branch: test.branch, index: choiceIndex });
        } else {
          selectChoice(0);
          result.steps.push({ action: 'selectChoice', branch: test.branch, index: 0, note: 'branch not found' });
        }
        await wait(1000);
      }

      // 自动完成对话（推进所有对话行直到结束）
      const dialogueResult = await completeDialogue();
      result.steps.push({ action: 'completeDialogue', result: dialogueResult });
    }

    // 5. 获取最终状态并验证
    await wait(500);
    const finalState = getGameState();
    result.finalState = {
      R: finalState.R,
      P: finalState.P,
      W: finalState.W,
      cardsCount: finalState.cards.length,
      flagsCount: Object.keys(finalState.flags).length
    };

    // 6. 验证预期结果
    const expected = test.expectedResults || {};
    
    if (expected.rDelta !== undefined) {
      const actualRDelta = finalState.R - initialState.R;
      const passed = actualRDelta === expected.rDelta;
      result.verifications.push({ type: 'rDelta', expected: expected.rDelta, actual: actualRDelta, passed });
    }

    if (expected.pDelta !== undefined) {
      const actualPDelta = finalState.P - initialState.P;
      const passed = actualPDelta === expected.pDelta;
      result.verifications.push({ type: 'pDelta', expected: expected.pDelta, actual: actualPDelta, passed });
    }

    if (expected.cards?.length > 0) {
      for (const cardId of expected.cards) {
        const passed = hasCard(cardId);
        result.verifications.push({ type: 'card', expected: cardId, passed });
      }
    }

    if (expected.flags) {
      for (const [flagName, flagValue] of Object.entries(expected.flags)) {
        const passed = hasFlag(flagName) === flagValue;
        result.verifications.push({ type: 'flag', expected: `${flagName}=${flagValue}`, actual: hasFlag(flagName), passed });
      }
    }

    if (expected.abilities?.length > 0) {
      for (const ability of expected.abilities) {
        const passed = hasAbility(ability);
        result.verifications.push({ type: 'ability', expected: ability, passed });
      }
    }

    if (expected.nextZone) {
      await wait(2000);
      const currentZone = getGameState().currentZone;
      const passed = currentZone === expected.nextZone;
      result.verifications.push({ type: 'zoneTransition', expected: expected.nextZone, actual: currentZone, passed });
    }

    // 7. 判定整体结果
    const allPassed = result.verifications.length === 0 || result.verifications.every(v => v.passed);
    result.status = allPassed ? 'passed' : 'failed';
    result.endTime = Date.now();
    result.duration = result.endTime - result.startTime;

    if (verbose) {
      const icon = result.status === 'passed' ? '✅' : '❌';
      console.log(`${icon} [${result.id}] ${test.name} (${result.duration}ms)`);
      if (result.status === 'failed') {
        result.verifications.filter(v => !v.passed).forEach(v => {
          console.log(`   ❌ ${v.type}: expected ${v.expected}, got ${v.actual}`);
        });
      }
    }

  } catch (error) {
    result.status = 'error';
    result.error = error.message;
    console.error(`💥 [${test.id}] Error: ${error.message}`);
  }

  return result;
}

/**
 * 执行单个步骤
 */
async function executeStep(step) {
  const result = { action: step.action, success: false };
  
  switch (step.action) {
    case 'teleport':
      const teleportResult = teleport(step.zoneId);
      result.success = teleportResult.success;
      await wait(step.wait || 2000);
      break;
      
    case 'moveToObject':
      const moveResult = moveToObject(step.objectId);
      result.success = moveResult.success;
      await wait(step.wait || 500);
      break;
      
    case 'interact':
      const interactResult = interact();
      result.success = interactResult.success;
      await wait(step.wait || 1000);
      break;
      
    case 'selectChoice':
      completeTypewriter();
      await wait(300);
      const choiceResult = selectChoice(step.index ?? 0);
      result.success = choiceResult.success;
      await wait(step.wait || 1000);
      break;
      
    case 'waitForDialogue':
      await wait(step.timeout || 2000);
      result.success = true;
      break;
      
    case 'setFlag':
      const flagResult = setFlag(step.flag, step.value ?? true);
      result.success = flagResult.success;
      break;

    case 'setR':
      const rResult = setR(step.value);
      result.success = rResult.success;
      break;

    case 'setP':
      const pResult = setP(step.value);
      result.success = pResult.success;
      break;
      
    case 'longPress':
      const pressResult = await longPressInteract(step.duration || 1000);
      result.success = pressResult.success;
      break;
      
    case 'closeDialogue':
      closeDialogue();
      result.success = true;
      await wait(step.wait || 500);
      break;
      
    case 'closeCard':
      closeCard();
      result.success = true;
      await wait(step.wait || 500);
      break;
      
    case 'wait':
      await wait(step.duration || 1000);
      result.success = true;
      break;

    case 'unlockAbility':
      const abilityResult = unlockAbility(step.ability);
      result.success = abilityResult.success;
      break;

    case 'setupEnding':
      const endingResult = setupEnding(step.ending);
      result.success = endingResult.success;
      break;
      
    default:
      result.error = `Unknown action: ${step.action}`;
  }
  
  return result;
}

/**
 * 执行 Zone 的所有测试
 */
async function runZoneTests(tests, options = {}) {
  const { zoneId, zoneName } = tests[0] || {};
  console.log(`\n=== Testing ${zoneId}: ${zoneName} ===`);
  
  teleport(zoneId);
  await wait(2000);

  const results = [];
  for (const test of tests) {
    const result = await executeTest(test, options);
    results.push(result);
    await wait(500);
  }

  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`--- ${zoneId} Summary: ${passed}/${results.length} passed ---\n`);

  return results;
}

/**
 * 生成测试报告
 */
function generateReport(allResults) {
  const passed = allResults.filter(r => r.status === 'passed').length;
  const failed = allResults.filter(r => r.status === 'failed').length;
  const skipped = allResults.filter(r => r.status === 'skipped').length;
  const errors = allResults.filter(r => r.status === 'error').length;

  console.log('\n========================================');
  console.log('  Test Results Summary');
  console.log('========================================');
  console.log(`  ✅ Passed:  ${passed}`);
  console.log(`  ❌ Failed:  ${failed}`);
  console.log(`  ⏭️ Skipped: ${skipped}`);
  console.log(`  💥 Errors:  ${errors}`);
  console.log(`  Total:     ${allResults.length}`);
  console.log('========================================\n');

  return {
    summary: { passed, failed, skipped, errors, total: allResults.length },
    results: allResults
  };
}

// ============================================================================
// 导出
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // 游戏访问
    getGame,
    getScene,
    getDebug,
    getGameState,
    
    // 状态操作
    teleport,
    wait,
    setFlag,
    hasFlag,
    setR,
    setP,
    addR,
    addP,
    getCounter,
    hasCard,
    hasAbility,
    obtainCard,
    unlockAbility,
    resetGameState,
    setupEnding,
    gotoChapter,
    
    // 对象操作
    moveToObject,
    findObject,
    getAllObjects,
    interact,
    longPressInteract,
    advanceDialogue,
    completeDialogue,
    
    // 对话操作
    selectChoice,
    completeTypewriter,
    closeDialogue,
    closeCard,
    isDialogueActive,
    getDialogueChoices,
    
    // 能力操作
    activateAbility,
    
    // 测试执行
    executeTest,
    executeStep,
    runZoneTests,
    generateReport
  };
}
