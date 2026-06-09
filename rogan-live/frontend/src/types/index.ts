// ── User & Auth ───────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar: string;
  bio: string;
  role: 'user' | 'creator' | 'admin';
  is_live: boolean;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ── Stream ────────────────────────────────────────────────────────
export interface Stream {
  id: string;
  creator_id: string;
  creator: User;
  title: string;
  description: string;
  is_live: boolean;
  is_private: boolean;
  category: string;
  stream_key: string;
  viewer_count: number;
  started_at: string;
  ended_at: string | null;
}

export interface CreateStreamPayload {
  title: string;
  description?: string;
  category?: string;
  is_private?: boolean;
}

// ── Gifts ─────────────────────────────────────────────────────────
export type GiftType = 'rose' | 'heart' | 'diamond' | 'rocket' | 'crown';

export interface Gift {
  id: string;
  sender_id: string;
  sender: User;
  stream_id: string;
  gift_type: GiftType;
  amount: number;
  message: string;
  tk_value: number;
  created_at: string;
}

export interface GiftOption {
  type: GiftType;
  name: string;
  icon: string;
  tk_price: number;
  color: string;
  animation_class: string;
}

export interface CreatorGiftStats {
  gift_type: GiftType;
  count: number;
  total_tk: number;
}

// ── Direct Messages ───────────────────────────────────────────────
export interface DirectMessage {
  id: string;
  sender_id: string;
  sender: User;
  receiver_id: string;
  receiver: User;
  content: string;
  is_paid: boolean;
  price: number;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  partner: User;
  last_message: DirectMessage;
  unread_count: number;
}

// ── Notifications ─────────────────────────────────────────────────
export type NotificationType =
  | 'gift'
  | 'follow'
  | 'subscribe'
  | 'mention'
  | 'live_start'
  | 'system'
  | 'payment';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ── Wallet & Transactions ─────────────────────────────────────────
export interface Wallet {
  id: string;
  user_id: string;
  tk_balance: number;
  wallet_address: string | null;
}

export type TransactionType = 'deposit' | 'withdraw' | 'gift_sent' | 'gift_received' | 'purchase';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  tk_amount: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

// ── Creator Profile ───────────────────────────────────────────────
export interface CreatorProfile {
  user: User;
  total_earnings_tk: number;
  total_earnings_rogan: number;
  subscriber_count: number;
  avg_rating: number;
  is_subscribed: boolean;
  subscription_price_tk: number;
  gift_stats: CreatorGiftStats[];
  daily_earnings: DailyEarning[];
}

export interface DailyEarning {
  date: string;
  tk_amount: number;
}

// ── Service Listing & Tasks ───────────────────────────────────────
export interface ServiceListing {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  price_tk: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface TaskRequest {
  id: string;
  service_id: string;
  service: ServiceListing;
  requester_id: string;
  requester: User;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  message: string;
  created_at: string;
}

// ── WebSocket Events ──────────────────────────────────────────────
export interface WSChatMessage {
  id: string;
  stream_id: string;
  user_id: string;
  username: string;
  avatar: string;
  message: string;
  is_gift: boolean;
  gift_type?: GiftType;
  gift_amount?: number;
  created_at: string;
}

export interface WSGiftEvent {
  id: string;
  stream_id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar: string;
  gift_type: GiftType;
  amount: number;
  message: string;
  tk_value: number;
  created_at: string;
}

export interface WSViewerUpdate {
  stream_id: string;
  viewer_count: number;
}

export interface WSTypingEvent {
  stream_id: string;
  user_id: string;
  username: string;
}

export interface WSNotification {
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
}

// ── Stream Keys ──────────────────────────────────────────────────
export interface StreamKey {
  id: string;
  key: string;
  label: string;
  is_active: boolean;
  is_revoked: boolean;
  last_used_at: string | null;
  created_at: string;
}

// ── Private Shows ────────────────────────────────────────────────
export interface PrivateShow {
  id: string;
  creator_id: string;
  creator: User;
  stream_id: string;
  title: string;
  price_tk: number;
  max_viewers: number;
  duration_minutes: number;
  current_viewers: number;
  started_at: string;
  ends_at: string | null;
  is_active: boolean;
  total_revenue_tk: number;
}

export interface PrivateShowViewer {
  user_id: string;
  user: User;
  joined_at: string;
  paid_tk: number;
}

// ── DM Conversations (Enhanced) ──────────────────────────────────
export interface DMConversation {
  id: string;
  participants: User[];
  dm_price: number;
  last_message: DirectMessage;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface DMMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender: User;
  content: string;
  is_paid: boolean;
  price: number;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ── Tasks & Bidding ──────────────────────────────────────────────
export interface Task {
  id: string;
  creator_id: string;
  creator: User;
  title: string;
  description: string;
  category: string;
  price_tk: number;
  deadline: string;
  status: 'open' | 'bidding' | 'in_progress' | 'completed' | 'disputed';
  bids: TaskBid[];
  winning_bid_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskBid {
  id: string;
  task_id: string;
  bidder_id: string;
  bidder: User;
  amount_tk: number;
  message: string;
  is_accepted: boolean;
  created_at: string;
}

// ── Subscriptions ────────────────────────────────────────────────
export interface SubscriptionTier {
  id: string;
  creator_id: string;
  creator: User;
  name: string;
  price_tk: number;
  perks: string[];
  max_subscribers: number;
  current_subscribers: number;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  tier_id: string;
  tier: SubscriptionTier;
  subscriber_id: string;
  subscriber: User;
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string;
  cancelled_at: string | null;
}

// ── Marketplace ──────────────────────────────────────────────────
export type ProductType = 'digital' | 'payperview' | 'custom';

export interface MarketplaceProduct {
  id: string;
  creator_id: string;
  creator: User;
  title: string;
  description: string;
  price_tk: number;
  product_type: ProductType;
  thumbnail_url: string;
  content_url: string;
  is_published: boolean;
  purchase_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductPurchase {
  id: string;
  product_id: string;
  product: MarketplaceProduct;
  buyer_id: string;
  buyer: User;
  amount_tk: number;
  access_url: string;
  purchased_at: string;
}

// ── PK Battles ───────────────────────────────────────────────────
export type PKBattleStatus = 'pending' | 'live' | 'completed' | 'cancelled';

export interface PKBattle {
  id: string;
  creator_a_id: string;
  creator_a: User;
  creator_b_id: string;
  creator_b: User;
  stream_a_id: string;
  stream_b_id: string;
  duration_minutes: number;
  status: PKBattleStatus;
  score_a: number;
  score_b: number;
  entry_gift_type: GiftType;
  entry_gift_amount: number;
  started_at: string | null;
  ends_at: string | null;
  winner_id: string | null;
  winner: User | null;
  created_at: string;
}

export interface PKBattleGift {
  id: string;
  battle_id: string;
  sender_id: string;
  sender: User;
  target_creator_id: string;
  gift_type: GiftType;
  amount: number;
  tk_value: number;
  created_at: string;
}

// ── Web3 & Wallet ────────────────────────────────────────────────
export interface WalletInfo {
  id: string;
  user_id: string;
  tk_balance: number;
  rogan_balance: number;
  wallet_address: string | null;
  eth_address: string | null;
  is_wallet_connected: boolean;
}

export interface SIWEResponse {
  message: string;
  nonce: string;
  token: string;
  user: User;
}

export interface Web3Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount_tk: number;
  amount_rogan: number;
  tx_hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  confirmed_at: string | null;
}

// ── Moderation ───────────────────────────────────────────────────
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
export type ReportReason = 'harassment' | 'spam' | 'nudity' | 'violence' | 'hate_speech' | 'other';

export interface ModerationReport {
  id: string;
  reporter_id: string;
  reporter: User;
  target_user_id: string;
  target_user: User;
  target_type: 'stream' | 'message' | 'user' | 'product';
  target_id: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface UserBan {
  id: string;
  user_id: string;
  user: User;
  reason: string;
  banned_by: string;
  expires_at: string | null;
  is_permanent: boolean;
  created_at: string;
}

export interface UserStrike {
  id: string;
  user_id: string;
  user: User;
  reason: string;
  strike_type: 'warning' | 'strike' | 'suspension';
  issued_by: string;
  created_at: string;
}

// ── OAuth ────────────────────────────────────────────────────────
export type OAuthProvider = 'google' | 'discord' | 'twitter' | 'twitch';

export interface OAuthState {
  provider: OAuthProvider;
  redirect_url: string;
  state: string;
}

// ── API Response Wrappers ─────────────────────────────────────────
export interface PaginatedResponse<T> {
  streams?: T[];
  items?: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface APIError {
  detail: string;
  status_code: number;
}
