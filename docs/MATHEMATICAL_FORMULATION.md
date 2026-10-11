# Mathematical Formulation: Audio Architecture Engine

## 1. Domain Definition

Let $\mathcal{C} = \{T_1, T_2, \dots, T_N\}$ be the track catalog, where each track $T_i$ is parameterized by a multi-dimensional acoustic vector:
$$\mathbf{v}(T_i) = \begin{bmatrix} e_i \\ b_i \\ c_i \\ g_i \\ d_i \end{bmatrix} = \begin{bmatrix} \text{Acoustic Energy} \in [0, 1] \\ \text{Tempo (BPM)} \in \mathbb{R}^+ \\ \text{Camelot Key Code} \in \{1\text{A}\dots 12\text{A}, 1\text{B}\dots 12\text{B}\} \\ \text{Genre Label} \in \mathcal{G} \\ \text{Duration (seconds)} \in \mathbb{Z}^+ \end{bmatrix}$$

Given user inputs:
- Target duration $D_{\text{target}}$ (seconds)
- Permissible genres $\mathcal{G}_{\text{user}} \subseteq \mathcal{G}$
- Target continuous energy curve $E_{\text{target}}(t): [0, 1] \rightarrow [0.05, 0.95]$

Find an ordered sequence of tracks $\mathcal{S} = (T_{\pi(1)}, T_{\pi(2)}, \dots, T_{\pi(K)})$ maximizing composite session fitness.

---

## 2. Objective Functions

### 2.1 Energy Curve Fitness
For each track $T_{\pi(k)}$ positioned at normalized time:
$$t_k = \frac{\sum_{j=1}^{k-1} d_{\pi(j)} + \frac{1}{2}d_{\pi(k)}}{\sum_{j=1}^K d_{\pi(j)}}$$

The energy error is:
$$\epsilon_{\text{energy}}(k) = |e_{\pi(k)} - E_{\text{target}}(t_k)|$$
$$S_{\text{energy}}(k) = 1.0 - \epsilon_{\text{energy}}(k)$$

### 2.2 Tempo Proximity & Harmonic Doubling
Tempo continuity penalizes abrupt jumps while recognizing that tempos related by octave multipliers (e.g., half-time $70 \text{ BPM}$ to double-time $140 \text{ BPM}$) are perceptually coherent:
$$\Delta b_k = \min\left( |b_{\pi(k)} - b_{\pi(k-1)}|, |b_{\pi(k)} - 2b_{\pi(k-1)}|, |2b_{\pi(k)} - b_{\pi(k-1)}| \right)$$
$$S_{\text{tempo}}(k) = \exp\left( -\frac{(\Delta b_k)^2}{2\sigma_{\text{bpm}}^2} \right), \quad \sigma_{\text{bpm}} = 12.0$$

### 2.3 Harmonic Camelot Compatibility Group $\mathbb{Z}_{12} \times \mathbb{Z}_2$
Let Camelot codes be mapped to circular coordinates $(h, m)$ with $h \in \mathbb{Z}_{12}$ and mode $m \in \{0, 1\}$.
Circular distance:
$$d_{\text{Camelot}}(C_1, C_2) = \min(|h_1 - h_2|, 12 - |h_1 - h_2|)$$

The harmonic transition compatibility is given by:
$$S_{\text{harmonic}}(C_1, C_2) = \begin{cases}
1.00 & d_{\text{Camelot}} = 0 \land m_1 = m_2 \quad (\text{Identical key}) \\
0.92 & d_{\text{Camelot}} = 0 \land m_1 \neq m_2 \quad (\text{Relative Major/Minor}) \\
0.85 & d_{\text{Camelot}} = 1 \land m_1 = m_2 \quad (\text{Fifth / Fourth transition}) \\
0.75 & d_{\text{Camelot}} = 1 \land m_1 \neq m_2 \quad (\text{Diagonal modal shift}) \\
0.65 & d_{\text{Camelot}} = 2 \land m_1 = m_2 \quad (\text{Energy modulation boost}) \\
\max(0.10, 0.50 - 0.08 \cdot d_{\text{Camelot}}) & d_{\text{Camelot}} \ge 3
\end{cases}$$

### 2.4 Multi-Genre Acoustic Affinity Matrix
Genre transitions $g_1 \rightarrow g_2$ are scored via symmetric affinity coefficients $\mathbf{A}(g_1, g_2) \in [0.60, 1.00]$, prioritizing acoustic bridges (e.g. classical piano to indie pop bridged by ambient/lo-fi textures).

---

## 3. Optimization via Beam Search

Let state $\mathbf{s}_k = (\text{seq}_k, \text{elapsed}_k, \text{score}_k)$ represent a path of length $k$.
At step $k$:
1. Candidate expansion evaluates all $T \in \mathcal{C}_{\text{available}}$.
2. Scored candidate transition:
   $$\text{Fitness}(T, \mathbf{s}_k) = \text{score}_k + \left( w_e S_{\text{energy}} + w_t S_{\text{tempo}} + w_h S_{\text{harmonic}} + w_g S_{\text{genre}} \right) - \lambda_{\text{overshoot}}$$
3. Pruning retains the top $B = 6$ paths by average step fitness.
4. Terminates when $\text{elapsed} \ge D_{\text{target}} - \delta_{\text{tol}}$.
