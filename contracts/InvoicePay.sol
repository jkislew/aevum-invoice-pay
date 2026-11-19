// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice Minimal ERC-20 interface (tUSD8 on Aevum Testnet).
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title InvoicePay — invoice payments with confirmation-of-payee on Aevum Testnet
/// @notice A merchant (issuer) creates an invoice naming a payee, an exact tUSD8
///         amount, a human-readable payee label and a memo. The payer reviews the
///         invoice (confirmation of payee), approves tUSD8, and pays. Funds move
///         directly from payer to payee — the contract never takes custody.
///         Built for the Aevum Builder Challenge #1 (QDay), tracks:
///         "Invoice Payments" + "Confirmation of Payee".
contract InvoicePay {
    enum Status {
        Open,
        Paid,
        Cancelled
    }

    struct Invoice {
        address issuer; // who created the invoice
        address payee; // who gets paid
        string payeeLabel; // human-readable payee name shown to the payer before paying
        uint256 amount; // exact tUSD8 amount (6 decimals)
        string memo; // what the invoice is for
        uint64 expiresAt; // unix time after which the invoice can no longer be paid
        Status status;
        address payer; // who paid (zero until paid)
        uint64 paidAt; // unix time of payment
    }

    IERC20 public immutable token;
    uint256 public invoiceCount;
    mapping(uint256 => Invoice) private _invoices;

    event InvoiceCreated(
        uint256 indexed id,
        address indexed issuer,
        address indexed payee,
        uint256 amount,
        string payeeLabel,
        string memo,
        uint64 expiresAt
    );
    event InvoicePaid(uint256 indexed id, address indexed payer, address indexed payee, uint256 amount);
    event InvoiceCancelled(uint256 indexed id, address indexed issuer);

    error InvoiceNotFound(uint256 id);
    error InvoiceNotOpen(uint256 id);
    error InvoiceExpired(uint256 id);
    error NotIssuer(uint256 id);
    error ZeroAddress();
    error ZeroAmount();
    error ExpiryInPast();
    error TransferFailed();

    constructor(address token_) {
        if (token_ == address(0)) revert ZeroAddress();
        token = IERC20(token_);
    }

    /// @notice Create an invoice. Returns the invoice id (sequential, starting at 1).
    /// @param payee Address that will receive the tUSD8.
    /// @param payeeLabel Human-readable payee name (confirmation of payee).
    /// @param amount Exact tUSD8 amount in token base units (6 decimals).
    /// @param memo What the invoice is for.
    /// @param expiresAt Unix timestamp after which payment is rejected.
    function createInvoice(
        address payee,
        string calldata payeeLabel,
        uint256 amount,
        string calldata memo,
        uint64 expiresAt
    ) external returns (uint256 id) {
        if (payee == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (expiresAt <= block.timestamp) revert ExpiryInPast();

        id = ++invoiceCount;
        _invoices[id] = Invoice({
            issuer: msg.sender,
            payee: payee,
            payeeLabel: payeeLabel,
            amount: amount,
            memo: memo,
            expiresAt: expiresAt,
            status: Status.Open,
            payer: address(0),
            paidAt: 0
        });
        emit InvoiceCreated(id, msg.sender, payee, amount, payeeLabel, memo, expiresAt);
    }

    /// @notice Pay an open invoice. Caller must have approved this contract to
    ///         spend at least the invoice amount of tUSD8. Funds go straight
    ///         from the caller to the invoice's payee.
    function payInvoice(uint256 id) external {
        Invoice storage inv = _invoices[id];
        if (inv.issuer == address(0)) revert InvoiceNotFound(id);
        if (inv.status != Status.Open) revert InvoiceNotOpen(id);
        if (block.timestamp > inv.expiresAt) revert InvoiceExpired(id);

        // effects before interaction
        inv.status = Status.Paid;
        inv.payer = msg.sender;
        inv.paidAt = uint64(block.timestamp);

        bool ok = token.transferFrom(msg.sender, inv.payee, inv.amount);
        if (!ok) revert TransferFailed();

        emit InvoicePaid(id, msg.sender, inv.payee, inv.amount);
    }

    /// @notice Cancel an open invoice. Only the issuer can cancel.
    function cancelInvoice(uint256 id) external {
        Invoice storage inv = _invoices[id];
        if (inv.issuer == address(0)) revert InvoiceNotFound(id);
        if (msg.sender != inv.issuer) revert NotIssuer(id);
        if (inv.status != Status.Open) revert InvoiceNotOpen(id);
        inv.status = Status.Cancelled;
        emit InvoiceCancelled(id, msg.sender);
    }

    /// @notice Read a full invoice (used by the payment-request page so the payer
    ///         can verify payee, amount and memo before approving anything).
    function getInvoice(uint256 id) external view returns (Invoice memory) {
        if (_invoices[id].issuer == address(0)) revert InvoiceNotFound(id);
        return _invoices[id];
    }
}
