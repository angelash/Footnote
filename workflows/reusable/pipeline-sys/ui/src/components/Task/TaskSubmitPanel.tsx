/**
 * TaskSubmitPanel - 任务提交面板
 * 支持多种任务类型的统一提交入口
 */

import React, { useState } from 'react';
import {
  TaskCategory,
  TaskSubmitInput,
  RoleConfig,
  ROLE_CONFIGS,
  WHITEBOX_CONFIGS,
  getCategoryLabel,
  getCategoryColor,
  getRolesByCategory,
  submitIntake,
  submitToEndpoint,
  submitWhitebox,
} from '../../api/taskApi';
import './TaskSubmitPanel.css';

// ============================================
// 类别选择组件
// ============================================

interface CategorySelectorProps {
  selected: TaskCategory | null;
  onSelect: (category: TaskCategory) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selected, onSelect }) => {
  const categories: TaskCategory[] = ['intake', 'engineering', 'art', 'level', 'whitebox', 'lead'];

  return (
    <div className="category-selector">
      <h3>选择任务类型</h3>
      <div className="category-grid">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${selected === cat ? 'active' : ''}`}
            style={{ '--category-color': getCategoryColor(cat) } as React.CSSProperties}
            onClick={() => onSelect(cat)}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// 角色选择组件
// ============================================

interface RoleSelectorProps {
  category: TaskCategory;
  selected: RoleConfig | null;
  onSelect: (role: RoleConfig) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ category, selected, onSelect }) => {
  const roles = getRolesByCategory(category);

  if (category === 'intake') {
    return null; // 智能派单不需要选择角色
  }

  return (
    <div className="role-selector">
      <h4>选择具体角色</h4>
      <div className="role-list">
        {roles.map((role) => (
          <button
            key={`${role.id}-${role.endpoint}`}
            className={`role-btn ${selected?.endpoint === role.endpoint ? 'active' : ''}`}
            onClick={() => onSelect(role)}
          >
            <span className="role-emoji">{role.emoji}</span>
            <span className="role-name">{role.name}</span>
            <span className="role-desc">{role.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// 白盒选择组件
// ============================================

interface WhiteboxSelectorProps {
  selected: typeof WHITEBOX_CONFIGS[0] | null;
  onSelect: (config: typeof WHITEBOX_CONFIGS[0]) => void;
}

const WhiteboxSelector: React.FC<WhiteboxSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="whitebox-selector">
      <h4>选择白盒类型</h4>
      <div className="whitebox-list">
        {WHITEBOX_CONFIGS.map((config) => (
          <button
            key={config.type}
            className={`whitebox-btn ${selected?.type === config.type ? 'active' : ''}`}
            onClick={() => onSelect(config)}
          >
            <span className="whitebox-emoji">{config.emoji}</span>
            <span className="whitebox-name">{config.name}</span>
            <span className="whitebox-desc">{config.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// 表单组件
// ============================================

interface TaskFormProps {
  category: TaskCategory;
  role: RoleConfig | null;
  whiteboxConfig: typeof WHITEBOX_CONFIGS[0] | null;
  onSubmit: (input: TaskSubmitInput) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  category,
  role,
  whiteboxConfig,
  onSubmit,
  onCancel,
  loading,
}) => {
  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('feature');
  const [priority, setPriority] = useState(5);
  const [taskPackPath, setTaskPackPath] = useState('');
  const [complexity, setComplexity] = useState('medium');
  const [zoneId, setZoneId] = useState('');
  const [sceneName, setSceneName] = useState('');
  const [characterId, setCharacterId] = useState('');
  const [animationType, setAnimationType] = useState('');
  const [effectType, setEffectType] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [objectId, setObjectId] = useState('');
  const [billboardText, setBillboardText] = useState('');
  const [asyncMode, setAsyncMode] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input: TaskSubmitInput = {
      title,
      description,
      task_type: taskType,
      priority,
      task_pack_path: taskPackPath || undefined,
      complexity: complexity || undefined,
      zone_id: zoneId || undefined,
      scene_name: sceneName || undefined,
      character_id: characterId || undefined,
      animation_type: animationType || undefined,
      effect_type: effectType || undefined,
      chapter_id: chapterId || undefined,
      object_id: objectId || undefined,
      billboard_text: billboardText || undefined,
      async: asyncMode,
    };

    await onSubmit(input);
  };

  // 根据类别和角色显示不同的字段
  const showField = (field: string): boolean => {
    if (category === 'intake') {
      return ['title', 'description', 'taskType', 'priority'].includes(field);
    }
    if (category === 'whitebox') {
      if (!whiteboxConfig) return false;
      if (field === 'zoneId' || field === 'sceneName') return whiteboxConfig.type === 'scene';
      if (field === 'characterId') return whiteboxConfig.type === 'character';
      if (field === 'objectId' || field === 'billboardText') return whiteboxConfig.type === 'object';
      return false;
    }
    if (!role) return false;
    const allFields = [...role.requiredFields, ...role.optionalFields];
    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      task_pack_path: 'taskPackPath',
      complexity: 'complexity',
      zone_id: 'zoneId',
      scene_name: 'sceneName',
      character_id: 'characterId',
      animation_type: 'animationType',
      effect_type: 'effectType',
      chapter_id: 'chapterId',
      asset_list: 'assetList',
    };
    return allFields.some((f) => fieldMap[f] === field);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {/* 标题（必填） */}
      <div className="form-group">
        <label>任务标题 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入任务标题..."
          required
        />
      </div>

      {/* 描述 */}
      {(category === 'intake' || showField('description')) && (
        <div className="form-group">
          <label>任务描述 {category === 'intake' ? '*' : ''}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="详细描述任务需求..."
            rows={4}
            required={category === 'intake'}
          />
        </div>
      )}

      {/* 智能派单专用字段 */}
      {category === 'intake' && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>任务类型</label>
              <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
                <option value="feature">功能开发</option>
                <option value="bugfix">Bug修复</option>
                <option value="art">美术资源</option>
                <option value="level">关卡设计</option>
                <option value="narrative">剧情文案</option>
                <option value="optimization">性能优化</option>
                <option value="refactor">代码重构</option>
              </select>
            </div>
            <div className="form-group">
              <label>优先级 (1-10)</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                min={1}
                max={10}
              />
            </div>
          </div>
        </>
      )}

      {/* TaskPack路径 */}
      {showField('taskPackPath') && (
        <div className="form-group">
          <label>TaskPack 路径</label>
          <input
            type="text"
            value={taskPackPath}
            onChange={(e) => setTaskPackPath(e.target.value)}
            placeholder="design/ai-native/03_taskpacks/T-XXXX_xxx.md"
          />
        </div>
      )}

      {/* 复杂度 */}
      {showField('complexity') && (
        <div className="form-group">
          <label>复杂度</label>
          <select value={complexity} onChange={(e) => setComplexity(e.target.value)}>
            <option value="low">简单</option>
            <option value="medium">中等</option>
            <option value="high">复杂</option>
          </select>
        </div>
      )}

      {/* Zone ID */}
      {showField('zoneId') && (
        <div className="form-group">
          <label>Zone ID *</label>
          <input
            type="text"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            placeholder="C1-Z1, C2-Z3..."
            required
          />
        </div>
      )}

      {/* 场景名称 */}
      {showField('sceneName') && (
        <div className="form-group">
          <label>场景名称</label>
          <input
            type="text"
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            placeholder="维修局大厅、层下废墟..."
          />
        </div>
      )}

      {/* 角色 ID */}
      {showField('characterId') && (
        <div className="form-group">
          <label>角色 ID *</label>
          <input
            type="text"
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
            placeholder="cenhui, gulin, songlan..."
            required
          />
        </div>
      )}

      {/* 动画类型 */}
      {showField('animationType') && (
        <div className="form-group">
          <label>动画类型 *</label>
          <select value={animationType} onChange={(e) => setAnimationType(e.target.value)} required>
            <option value="">选择动画类型...</option>
            <option value="idle">待机</option>
            <option value="walk">行走</option>
            <option value="talk">说话</option>
            <option value="emotion">表情</option>
            <option value="skill">技能</option>
            <option value="cutscene">过场</option>
          </select>
        </div>
      )}

      {/* 特效类型 */}
      {showField('effectType') && (
        <div className="form-group">
          <label>特效类型 *</label>
          <select value={effectType} onChange={(e) => setEffectType(e.target.value)} required>
            <option value="">选择特效类型...</option>
            <option value="skill">技能特效</option>
            <option value="environment">环境特效</option>
            <option value="ui">UI特效</option>
            <option value="transition">转场特效</option>
            <option value="particle">粒子效果</option>
          </select>
        </div>
      )}

      {/* 章节 ID */}
      {showField('chapterId') && (
        <div className="form-group">
          <label>章节 ID</label>
          <input
            type="text"
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            placeholder="C0, C1, C2..."
          />
        </div>
      )}

      {/* 白盒：物件 ID */}
      {category === 'whitebox' && whiteboxConfig?.type === 'object' && (
        <>
          <div className="form-group">
            <label>物件 ID *</label>
            <input
              type="text"
              value={objectId}
              onChange={(e) => setObjectId(e.target.value)}
              placeholder="door_01, chest_02..."
              required
            />
          </div>
          <div className="form-group">
            <label>标签文字</label>
            <input
              type="text"
              value={billboardText}
              onChange={(e) => setBillboardText(e.target.value)}
              placeholder="显示在白盒上的文字..."
            />
          </div>
        </>
      )}

      {/* 异步模式 */}
      <div className="form-group form-checkbox">
        <label>
          <input
            type="checkbox"
            checked={asyncMode}
            onChange={(e) => setAsyncMode(e.target.checked)}
          />
          异步执行（加入队列后台运行）
        </label>
      </div>

      {/* 操作按钮 */}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '提交中...' : '🚀 提交任务'}
        </button>
      </div>
    </form>
  );
};

// ============================================
// 主组件
// ============================================

interface TaskSubmitPanelProps {
  onSuccess?: () => void;
}

export const TaskSubmitPanel: React.FC<TaskSubmitPanelProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'category' | 'role' | 'form'>('category');
  const [category, setCategory] = useState<TaskCategory | null>(null);
  const [role, setRole] = useState<RoleConfig | null>(null);
  const [whiteboxConfig, setWhiteboxConfig] = useState<typeof WHITEBOX_CONFIGS[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCategorySelect = (cat: TaskCategory) => {
    setCategory(cat);
    setRole(null);
    setWhiteboxConfig(null);
    setError(null);
    setSuccess(null);

    if (cat === 'intake') {
      // 智能派单直接进入表单
      setStep('form');
    } else if (cat === 'whitebox') {
      // 白盒需要选择类型
      setStep('role');
    } else {
      // 其他需要选择角色
      setStep('role');
    }
  };

  const handleRoleSelect = (selectedRole: RoleConfig) => {
    setRole(selectedRole);
    setStep('form');
  };

  const handleWhiteboxSelect = (config: typeof WHITEBOX_CONFIGS[0]) => {
    setWhiteboxConfig(config);
    setStep('form');
  };

  const handleSubmit = async (input: TaskSubmitInput) => {
    setLoading(true);
    setError(null);

    try {
      if (category === 'intake') {
        await submitIntake(input);
      } else if (category === 'whitebox' && whiteboxConfig) {
        await submitWhitebox(whiteboxConfig.type, input);
      } else if (role) {
        await submitToEndpoint(role.endpoint, input);
      } else {
        throw new Error('请先选择任务类型');
      }

      setSuccess('✅ 任务已提交成功！');
      setTimeout(() => {
        onSuccess?.();
        handleReset();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('category');
    setCategory(null);
    setRole(null);
    setWhiteboxConfig(null);
    setError(null);
    setSuccess(null);
  };

  const handleBack = () => {
    if (step === 'form') {
      if (category === 'intake') {
        setStep('category');
      } else {
        setStep('role');
      }
    } else if (step === 'role') {
      setStep('category');
    }
  };

  return (
    <div className="task-submit-panel">
      <div className="panel-header">
        <h2>➕ 发起开发任务</h2>
        {step !== 'category' && (
          <button className="btn-back" onClick={handleBack}>
            ← 返回
          </button>
        )}
      </div>

      {/* 进度指示 */}
      <div className="progress-steps">
        <div className={`step ${step === 'category' ? 'active' : step !== 'category' ? 'done' : ''}`}>
          1. 选择类型
        </div>
        <div className={`step ${step === 'role' ? 'active' : step === 'form' ? 'done' : ''}`}>
          2. 选择角色
        </div>
        <div className={`step ${step === 'form' ? 'active' : ''}`}>
          3. 填写详情
        </div>
      </div>

      {/* 错误/成功提示 */}
      {error && <div className="panel-error">❌ {error}</div>}
      {success && <div className="panel-success">{success}</div>}

      {/* 步骤内容 */}
      <div className="panel-content">
        {step === 'category' && (
          <CategorySelector selected={category} onSelect={handleCategorySelect} />
        )}

        {step === 'role' && category && category !== 'whitebox' && (
          <RoleSelector category={category} selected={role} onSelect={handleRoleSelect} />
        )}

        {step === 'role' && category === 'whitebox' && (
          <WhiteboxSelector selected={whiteboxConfig} onSelect={handleWhiteboxSelect} />
        )}

        {step === 'form' && category && (
          <TaskForm
            category={category}
            role={role}
            whiteboxConfig={whiteboxConfig}
            onSubmit={handleSubmit}
            onCancel={handleReset}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default TaskSubmitPanel;
