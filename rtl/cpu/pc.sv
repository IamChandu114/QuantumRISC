`timescale 1ns / 1ps
//////////////////////////////////////////////////////////////////////////////////
// Project : QuantumRISC
// Module  : Program Counter (PC)
// Author  : Chandu Vemula
//
// Description:
// 32-bit Program Counter for QuantumRISC.
//
// Features:
// - Asynchronous Reset
// - Enable Signal (supports pipeline stalls)
// - Loads next program counter value
//////////////////////////////////////////////////////////////////////////////////

module pc (
    input  logic        clk,
    input  logic        reset,
    input  logic        enable,
    input  logic [31:0] pc_next,
    output logic [31:0] pc_current
);

always_ff @(posedge clk or posedge reset) begin
    if (reset)
        pc_current <= 32'h00000000;
    else if (enable)
        pc_current <= pc_next;
end

endmodule